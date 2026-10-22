// =============================================================================
// [GLOBAL REUSABLE COMPONENT - DANBOORU-STYLE IMPERIAL PAGINATION]
// Phân trang chuẩn phong cách Danbooru cao cấp với giao diện Gate of Babylon:
// - Nút First («), Prev (‹), Next (›), Last (»)
// - Dải số thông minh tự động rút gọn bằng dấu chấm lửng (...)
// - Ô nhập nhảy trang trực tiếp (Quick Jump Input)
// - Thông số đếm số lượng bản ghi hiển thị thời gian thực
// =============================================================================
import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowRight
} from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize = 16,
  onPageChange,
  className = '',
}) => {
  const [jumpValue, setJumpValue] = useState<string>('');

  if (totalPages <= 1) return null;

  // Thuật toán sinh dải trang kiểu Danbooru thông minh
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const delta = 2; // Số trang hiển thị 2 bên của trang hiện tại

    const left = Math.max(2, currentPage - delta);
    const right = Math.min(totalPages - 1, currentPage + delta);

    // Luôn luôn có trang 1
    pages.push(1);

    if (left > 2) {
      pages.push('...');
    }

    for (let i = left; i <= right; i++) {
      pages.push(i);
    }

    if (right < totalPages - 1) {
      pages.push('...');
    }

    // Luôn luôn có trang cuối
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseInt(jumpValue, 10);
    if (!isNaN(target) && target >= 1 && target <= totalPages) {
      onPageChange(target);
      setJumpValue('');
    }
  };

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = totalItems ? Math.min(currentPage * pageSize, totalItems) : currentPage * pageSize;

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 p-3 rounded-xl bg-[#100d16] border border-[#261d33] font-mono text-xs ${className}`}>

      {/* Thông tin số lượng bản ghi */}
      {totalItems !== undefined && (
        <div className="text-[#8c7a9e] text-[11px] whitespace-nowrap">
          Showing <strong className="text-[#ffd86b]">{startItem}–{endItem}</strong> of <strong className="text-white">{totalItems}</strong> Treasures
        </div>
      )}

      {/* Dải nút chuyển trang Danbooru */}
      <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-thin">

        {/* Nút Về đầu trang 1 («) */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          title="First Page"
          className="p-1.5 rounded-lg bg-[#171320] border border-[#2b2238] hover:border-[#d4af37] text-[#8c7a9e] hover:text-[#ffd86b] disabled:opacity-30 disabled:pointer-events-none transition duration-75 active:scale-95 cursor-pointer"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>

        {/* Nút Lùi 1 trang (‹) */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          title="Previous Page"
          className="p-1.5 rounded-lg bg-[#171320] border border-[#2b2238] hover:border-[#d4af37] text-[#8c7a9e] hover:text-[#ffd86b] disabled:opacity-30 disabled:pointer-events-none transition duration-75 active:scale-95 cursor-pointer mr-1"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Danh sách các số trang */}
        {getPageNumbers().map((p, idx) => {
          if (p === '...') {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="px-2 py-1 text-[#685c78] select-none text-xs"
              >
                ...
              </span>
            );
          }

          const pageNum = Number(p);
          const isActive = pageNum === currentPage;

          return (
            <button
              key={`page-${pageNum}`}
              type="button"
              onClick={() => onPageChange(pageNum)}
              className={`min-w-[32px] h-8 px-2 rounded-lg font-bold text-xs transition duration-75 select-none cursor-pointer flex items-center justify-center active:scale-95 ${
                isActive
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#aa8214] text-black shadow-gold-sm border border-[#ffd86b]'
                  : 'bg-[#171320] text-[#8c7a9e] hover:text-white hover:bg-[#221b2e] border border-[#2b2238] hover:border-[#524124]'
              }`}
            >
              {pageNum}
            </button>
          );
        })}

        {/* Nút Tiến 1 trang (›) */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          title="Next Page"
          className="p-1.5 rounded-lg bg-[#171320] border border-[#2b2238] hover:border-[#d4af37] text-[#8c7a9e] hover:text-[#ffd86b] disabled:opacity-30 disabled:pointer-events-none transition duration-75 active:scale-95 cursor-pointer ml-1"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Nút Đến trang cuối (») */}
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          title="Last Page"
          className="p-1.5 rounded-lg bg-[#171320] border border-[#2b2238] hover:border-[#d4af37] text-[#8c7a9e] hover:text-[#ffd86b] disabled:opacity-30 disabled:pointer-events-none transition duration-75 active:scale-95 cursor-pointer"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Ô Quick Jump to Page */}
      <form onSubmit={handleJump} className="flex items-center gap-1.5">
        <span className="text-[11px] text-[#685c78]">Go:</span>
        <input
          type="number"
          min={1}
          max={totalPages}
          placeholder="#"
          value={jumpValue}
          onChange={(e) => setJumpValue(e.target.value)}
          className="w-12 h-7 bg-[#171320] border border-[#332842] focus:border-[#d4af37] rounded-md px-1.5 text-center text-xs text-white focus:outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          type="submit"
          disabled={!jumpValue}
          className="p-1.5 h-7 rounded-md bg-[#1e1728] hover:bg-[#2b213a] border border-[#3d304f] text-[#ffd86b] disabled:opacity-30 transition flex items-center justify-center"
        >
          <ArrowRight className="w-3 h-3" />
        </button>
      </form>
    </div>
  );
};
