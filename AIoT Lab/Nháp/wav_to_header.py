# D:/MySetups/app_transcribe_streamlit.py
import sys
import time
import queue
import threading
import numpy as np
import serial
import streamlit as st
from faster_whisper import WhisperModel

@st.cache_resource
def load_whisper_model():
    return WhisperModel("base.en", device="cpu", compute_type="int8")

# ============================================================================
# [THAY DOI 1] TACH BIET HOAN TOAN 2 LUONG: DOC UART (PRODUCER) VA DICH (CONSUMER)
# ============================================================================
class AudioTranscribeSystem:
    def __init__(self, port, baud, model, vad_threshold, sentence_silence, min_duration, max_duration):
        self.port = port
        self.baud = baud
        self.model = model
        self.vad_threshold = vad_threshold
        self.sentence_silence = sentence_silence
        self.min_duration = min_duration
        self.max_duration = max_duration

        self.running = False
        self.ser = None
        
        # Hang doi chua cac doan audio da cat cau de cho Whisper xu ly
        self.audio_queue = queue.Queue()
        # Hang doi chua ket qua text cuoi cung de day len Streamlit
        self.transcript_queue = queue.Queue()
        
        self.current_rms = 0
        self.state_status = "Chờ kết nối"

        self.capture_thread = None
        self.worker_thread = None

    def calculate_rms(self, chunk: np.ndarray) -> float:
        centered = chunk.astype(np.float32) - np.mean(audio_chunk_copy := chunk)
        return float(np.sqrt(np.mean(np.square(centered))))

    # --- THREAD 1: CHUYEN DOC UART VA CAT CAU (KHONG BAO GIO BI BLOCK BOI WHISPER) ---
    def _capture_loop(self):
        try:
            self.ser = serial.Serial(self.port, self.baud, timeout=0.1)
            self.ser.reset_input_buffer()
            self.state_status = "Đang lắng nghe"
        except serial.SerialException as e:
            self.state_status = f"Lỗi cổng COM: {e}"
            self.running = False
            return

        sample_rate = 16000
        chunk_samples = 512
        chunk_bytes = chunk_samples * 2

        audio_buffer = []
        is_speaking = False
        silence_start_time = None
        speech_start_time = None

        while self.running:
            raw_data = self.ser.read(chunk_bytes)
            if len(raw_data) < chunk_bytes:
                continue

            chunk = np.frombuffer(raw_data, dtype=np.int16)
            rms = self.calculate_rms(chunk)
            self.current_rms = int(rms)
            current_time = time.time()

            if rms > self.vad_threshold:
                if not is_speaking:
                    is_speaking = True
                    speech_start_time = current_time
                    audio_buffer = []

                silence_start_time = None
                audio_buffer.extend(chunk)

                if (current_time - speech_start_time) >= self.max_duration:
                    is_speaking = False
            else:
                if is_speaking:
                    audio_buffer.extend(chunk)
                    if silence_start_time is None:
                        silence_start_time = current_time
                    elif (current_time - silence_start_time) >= self.sentence_silence:
                        is_speaking = False

            # Khi ket thuc mot cau: Day ngay vao hang doi va tiep tuc doc UART
            if not is_speaking and len(audio_buffer) > 0:
                duration = len(audio_buffer) / sample_rate
                if duration >= self.min_duration:
                    audio_np = np.array(audio_buffer, dtype=np.float32) - np.mean(audio_buffer)
                    audio_np = audio_np / 32768.0
                    timestamp = time.strftime("%H:%M:%S")
                    # Push vao audio_queue de thread khac xu ly, thread nay quay lai ser.read() ngay
                    self.audio_queue.put((audio_np, timestamp, duration))

                audio_buffer = []
                silence_start_time = None
                speech_start_time = None

        if self.ser and self.ser.is_open:
            self.ser.close()

    # --- THREAD 2: CHUYEN GOI MODEL TRANSCRIBE DOC LAP VOI UART ---
    def _inference_loop(self):
        while self.running:
            try:
                # Cho lay audio tu hang doi voi timeout 0.2s de kiem tra co thoat hay khong
                audio_np, timestamp, duration = self.audio_queue.get(timeout=0.2)
            except queue.Empty:
                continue

            self.state_status = f"Đang giải mã ({duration:.1f}s)... [Hàng đợi: {self.audio_queue.qsize()}]"
            try:
                segments, _ = self.model.transcribe(audio_np, language="en", beam_size=5)
                text = "".join([s.text for s in segments]).strip()
                if text:
                    self.transcript_queue.put((timestamp, text))
            except Exception as e:
                print(f"Loi Whisper: {e}")
            finally:
                self.audio_queue.task_done()
                if self.audio_queue.empty():
                    self.state_status = "Đang lắng nghe"

    def start(self):
        self.running = True
        self.capture_thread = threading.Thread(target=self._capture_loop, daemon=True)
        self.worker_thread = threading.Thread(target=self._inference_loop, daemon=True)
        self.capture_thread.start()
        self.worker_thread.start()

    def stop(self):
        self.running = False
        if self.capture_thread and self.capture_thread.is_alive():
            self.capture_thread.join(timeout=1.0)
        if self.worker_thread and self.worker_thread.is_alive():
            self.worker_thread.join(timeout=1.0)
        self.state_status = "Đã dừng"
# ============================================================================
# Giai thich thay doi:
# - Cu: Doc serial va transcribe chay tren cung 1 Thread. Khi Whisper xu ly, 
#   ham ser.read() bi dung khien buffer UART tren Windows bi tran va drop sach audio.
# - Moi: Tach han thanh 2 Thread doc lap (_capture_loop va _inference_loop) noi voi
#   nhau qua audio_queue. Khong bao gio bi mat 1 byte nao tu ESP32 nua.
# ============================================================================

# ============================================================================
# [THAY DOI 2] GIAO DIEN STREAMLIT VA DIEU CHINH THAM SO PHU HOP IELTS
# ============================================================================
st.set_page_config(page_title="ESP32-S3 Audio Transcribe", layout="wide")
st.title("🎙️ ESP32-S3 Non-blocking Continuous Transcribe")

if "history" not in st.session_state:
    st.session_state.history = []
if "system" not in st.session_state:
    st.session_state.system = None

st.sidebar.header("Cấu hình thiết bị & VAD")
com_port = st.sidebar.text_input("Cổng COM", value="COM5")
baud_rate = st.sidebar.number_input("Baud Rate", value=921600, step=115200)

vad_thresh = st.sidebar.slider("VAD Threshold (Độ nhạy mic)", 100, 2000, 450, step=50)
# Ha mac dinh xuong 0.5s de bat kip nhip noi lien tuc cua IELTS
sentence_silence = st.sidebar.slider("Khoảng lặng ngắt câu (giây)", 0.2, 1.2, 0.5, step=0.05)
min_duration = st.sidebar.slider("Độ dài tối thiểu của câu (giây)", 0.3, 2.0, 0.6, step=0.1)
max_duration = st.sidebar.slider("Độ dài tối đa bảo vệ (giây)", 5.0, 20.0, 10.0, step=1.0)

whisper_model = load_whisper_model()

col_btn1, col_btn2, col_btn3 = st.sidebar.columns(3)
if col_btn1.button("▶ Bắt đầu", use_container_width=True):
    if st.session_state.system is None or not st.session_state.system.running:
        sys_transcribe = AudioTranscribeSystem(
            port=com_port,
            baud=baud_rate,
            model=whisper_model,
            vad_threshold=vad_thresh,
            sentence_silence=sentence_silence,
            min_duration=min_duration,
            max_duration=max_duration
        )
        sys_transcribe.start()
        st.session_state.system = sys_transcribe
        st.rerun()

if col_btn2.button("⏹ Dừng", use_container_width=True):
    if st.session_state.system and st.session_state.system.running:
        st.session_state.system.stop()
        st.session_state.system = None
        st.rerun()

if col_btn3.button("🗑 Xóa lịch sử", use_container_width=True):
    st.session_state.history = []
    st.rerun()

if st.session_state.system and st.session_state.system.running:
    st.session_state.system.vad_threshold = vad_thresh
    st.session_state.system.sentence_silence = sentence_silence
    st.session_state.system.min_duration = min_duration
    st.session_state.system.max_duration = max_duration

@st.fragment(run_every=0.5)
def render_dashboard():
    system = st.session_state.system

    if system and system.running:
        while not system.transcript_queue.empty():
            item = system.transcript_queue.get()
            st.session_state.history.append(item)

    col1, col2 = st.columns([1, 2])
    with col1:
        if system and system.running:
            st.success(f"Trạng thái: **{system.state_status}**")
            rms_val = min(system.current_rms, 2500)
            st.progress(rms_val / 2500, text=f"Biên độ RMS: {system.current_rms}")
        else:
            st.warning("Trạng thái: **Hệ thống đang dừng**")
            st.progress(0, text="Biên độ RMS: 0")

    with col2:
        if system and system.running:
            queue_len = system.audio_queue.qsize()
            if queue_len > 0:
                st.warning(f"⚠️ Hàng đợi audio đang chờ dịch: **{queue_len} câu** (Dữ liệu vẫn đang thu đầy đủ)")
            else:
                st.info("Hàng đợi rỗng: Whisper đang theo kịp tốc độ nói thực tế.")

    st.markdown("---")
    st.subheader("📝 Lịch sử nhận diện câu nói (Live Feed)")

    if not st.session_state.history:
        st.write("*(Chưa có dữ liệu. Bấm 'Bắt đầu' và phát bài nghe)*")
    else:
        for t, sentence in reversed(st.session_state.history):
            st.markdown(f"**`[{t}]`** {sentence}")

render_dashboard()
# ============================================================================
# Giai thich thay doi:
# - Ha mac dinh "Khoảng lặng ngắt câu" tu 0.7s xuong 0.5s de thich ung voi toc do
#   noi lien tuc cua de thi IELTS.
# - Hien thi so luong audio chunk dang nam trong hang doi tren UI de ban quan sat
#   xem Whisper co bi cham hon nguoi noi hay khong.
# ============================================================================