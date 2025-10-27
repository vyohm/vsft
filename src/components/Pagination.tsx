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
  // Show max 5 page numbers on mobile, 7 on desktop
  const getPageNumbers = () => {
    const maxVisible = typeof window !== 'undefined' && window.innerWidth < 768 ? 5 : 7
    const pages: (number | string)[] = []

    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    // Always show first page
    pages.push(1)

    if (currentPage > 3) {
      pages.push('...')
    }

    // Show pages around current page
    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    if (currentPage < totalPages - 2) {
      pages.push('...')
    }

    // Always show last page
    pages.push(totalPages)

    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className="flex flex-col items-center gap-4 mt-8">
      {/* Page info */}
      <div className="text-sm text-brand-quaternary">
        Page {currentPage} of {totalPages}
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-1 md:gap-2 flex-wrap justify-center">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 md:px-4 py-2 rounded-lg bg-brand-primary text-brand-light disabled:opacity-30 disabled:cursor-not-allowed hover:bg-brand-secondary hover:text-brand-primary transition-colors text-sm"
        >
          <span className="hidden md:inline">Previous</span>
          <span className="md:hidden">Prev</span>
        </button>

        <div className="flex gap-1 md:gap-2">
          {pageNumbers.map((page, idx) => (
            page === '...' ? (
              <span key={`ellipsis-${idx}`} className="px-2 py-2 text-brand-quaternary">
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page as number)}
                className={`px-3 md:px-4 py-2 rounded-lg transition-colors text-sm min-w-[40px] ${
                  currentPage === page
                    ? 'bg-brand-secondary text-brand-primary font-semibold shadow-md'
                    : 'bg-white text-brand-primary hover:bg-brand-tertiary border border-brand-quaternary'
                }`}
              >
                {page}
              </button>
            )
          ))}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 md:px-4 py-2 rounded-lg bg-brand-primary text-brand-light disabled:opacity-30 disabled:cursor-not-allowed hover:bg-brand-secondary hover:text-brand-primary transition-colors text-sm"
        >
          Next
        </button>
      </div>
    </div>
  )
}
