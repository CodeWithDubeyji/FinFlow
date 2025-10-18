import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import NavItems from './NavItems'
import UserDropdown from './UserDropdown'
import { searchStocks } from '@/lib/actions/finnhub.actions'

const Header = async({ user }: { user: User }) => {
  const initialStocks = await searchStocks();
  return (
    <header className='sticky top-0 header'>
      <div className='container header-wrapper'>
        <Link href={'/'} className='flex flex-row items-center gap-2'>
          <Image
            src='/assets/icons/image.png'
            alt='FinFlow'
            height={140}
            width={32}
            className='h-8 w-auto cursor-pointer'
            priority={false}
          />
          <h2 className='text-2xl font-bold text-gray-200'>FinFlow</h2>
        </Link>

        <nav className='hidden sm:block'>
          <NavItems initialStocks={initialStocks} />
        </nav>
        <UserDropdown user={user} initialStocks={initialStocks} />
      </div>
    </header>
  )
}

export default Header
