import React from 'react';
import { HazardBadge } from '../HazardBadge';
import { Pagination } from '../Pagination';

interface CodexItem {
  id: string;
  name: string;
  score: number;
  rank: string;
  type: string;
  description?: string;
}

interface CodexGridProps {
  items: CodexItem[];
  itemsPerPage?: number;
  onItemClick?: (item: CodexItem) => void;
  showDetails?: boolean;
  className?: string;
}

export const CodexGrid: React.FC<CodexGridProps> = ({
  items,
  itemsPerPage = 3,
  onItemClick,
  showDetails = false,
  className = '',
}) => {
  const [currentPage, setCurrentPage] = React.useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));
  const paginatedItems = items.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className={`${className} space-y-6`}>
      {/* Items Grid */}
      <div className="space-y-4">
        {paginatedItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-4 rounded-xl border transition-[border-color,box-shadow,transform] duration-75 ease-out hover:border-[#524124] hover:shadow-gold-sm cursor-pointer active:scale-[0.99] select-none"
            onClick={() => onItemClick && onItemClick(item)}
          >
            {/* Left */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#1e1726] border border-[#3e2c54] flex items-center justify-center font-mono font-bold text-xs text-[#ffd86b]">
                #{item.id.replace('item-', '#0')}
              </div>
              <div>
                <div className="text-sm font-bold text-white">{item.name}</div>
                {item.type && (
                  <div className="text-xs text-[#8c7a9e]">{item.type}</div>
                )}
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-4">
              {showDetails && (
                <HazardBadge score={item.score} rank={item.rank} size="md" showDetails={true} />
              )}
              {!showDetails && item.score !== undefined && item.rank !== undefined && (
                <HazardBadge score={item.score} rank={item.rank} size="sm" />
              )}
            </div>
          </div>
        ))}

        {/* Empty state */}
        {items.length === 0 && (
          <div className="p-8 text-center bg-[#120f18] rounded-2xl border border-[#2b2238]">
            <p className="text-xs text-[#8c7a9e]">No items to display</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {items.length > itemsPerPage && (
        <div className="flex justify-center pt-4 border-t border-[#231b2e]">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(p) => setCurrentPage(p)}
          />
        </div>
      )}
    </div>
  );
};