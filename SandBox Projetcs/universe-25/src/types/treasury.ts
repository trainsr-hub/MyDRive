// =============================================================================
// [GATE OF BABYLON - TREASURY MODULE CONTRACT INTERFACE]
// =============================================================================
import type { ComponentType } from 'react';

export interface TreasuryManifest {
  id: string;                  // Project ID khớp với backend (vd: 'music_app')
  name: string;                // Tên hiển thị của Kho báu (vd: 'Vinyl Angel')
  subname?: string;            // Subtitle hoặc tên tiếng Nhật (vd: '天界黑胶')
  description: string;         // Mô tả ngắn gọn về kho dữ liệu
  icon: ComponentType<{ className?: string }>; // Lucide icon
  accentColor: string;         // Mã màu chủ đạo (vd: '#d4af37', '#b82333')
  defaultTab?: string;
}

export interface TreasurySubView {
  id: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  component: ComponentType<{ projectId: string }>;
}

export interface TreasuryModule {
  manifest: TreasuryManifest;
  views: TreasurySubView[];    // Danh sách các tab con mà module này cung cấp
}
