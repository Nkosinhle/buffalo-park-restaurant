import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={
  title:'Buffalo Park Restaurant | Safari-Inspired Dining in Mahikeng',
  description:'Visit Buffalo Park Restaurant in Mahikeng for great food, refreshing drinks and live entertainment. Discover our dining spaces and request a table.',
  robots:{index:true,follow:true},
  openGraph:{title:'Buffalo Park Restaurant | Mahikeng',description:'Good food. Good vibes. Great company.',images:['/images/patio-venue.webp'],type:'website'},
};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en-ZA"><body>{children}</body></html>}
