'use client'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-4 py-2 rounded-lg bg-brand-primary text-brand-light disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-secondary hover:text-brand-primary transition-colors"
      >
        Previous
      </button>

      <div className="flex gap-2">
        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              currentPage === page
                ? 'bg-brand-secondary text-brand-primary font-semibold'
                : 'bg-white text-brand-primary hover:bg-brand-tertiary'
            }`}
          >
            {page}
          </button>
        ))}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-4 py-2 rounded-lg bg-brand-primary text-brand-light disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-secondary hover:text-brand-primary transition-colors"
      >
        Next
      </button>
    </div>
  )
}
