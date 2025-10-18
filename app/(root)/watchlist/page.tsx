import { Button } from '@/components/ui/button'
import WatchlistTable from '@/components/WatchlistTable'
import { SearchCommand } from '@/components/SearchCommand'
import { searchStocks, getNews } from '@/lib/actions/finnhub.actions'
import { getCurrentUserWatchlistSymbols } from '@/lib/actions/watchlist.actions'
import Link from 'next/link'

// Force dynamic rendering since we use headers for auth
export const dynamic = 'force-dynamic'

export default async function Watchlist() {
  const initialStocks = await searchStocks();
  const watchlistSymbols = await getCurrentUserWatchlistSymbols();
  const news = await getNews(watchlistSymbols);

  return (
    <div className='flex min-h-screen p-4 md:p-6 lg:p-8'>
      <section className='flex flex-col sm:flex-row gap-8 w-full'>
        <div className='flex flex-col gap-6 w-full sm:w-1/2'>
          <div className='flex items-center justify-between'>
            <h1 className='text-2xl font-bold'>Watchlist</h1>
            <SearchCommand
              renderAs="button"
              label="Add Stock"
              initialStocks={initialStocks}
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
            />
          </div>

          <div className='rounded-lg shadow-sm border '>
            <WatchlistTable />
          </div>
        </div>

        <div className='flex flex-col gap-6  w-full sm:w-1/2'>
          <div className='flex items-center justify-between'>
            <h2 className='text-2xl font-bold'>{watchlistSymbols.length > 0 ? 'Watchlist News' : 'General News'}</h2>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 space-y-4'>
            {news.length > 0 ? (
              news.slice(0, 6).map((article) => (
                <div key={article.id} className='rounded-lg border p-4 shadow-sm'>
                  <h3 className='font-semibold text-sm mb-2 line-clamp-2'>
                    <Link
                      href={article.url}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='hover:text-yellow-500 transition-colors'
                    >
                      {article.headline}
                    </Link>
                  </h3>
                  <p className='text-xs text-gray-600 mb-2 line-clamp-3'>
                    {article.summary}
                  </p>
                  <div className='flex items-center justify-between text-xs text-gray-500'>
                    <span>{article.source}</span>
                    <span>{new Date(article.datetime * 1000).toLocaleDateString()}</span>
                  </div>
                  {article.related && (
                    <div className='mt-2'>
                      <span className='inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded'>
                        {article.related}
                      </span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className='text-center text-gray-500 py-8'>
                <p>No news available</p>
                <p className='text-sm mt-1'>Add stocks to your watchlist to see personalized news</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
