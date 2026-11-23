import Link from 'next/link';

export const metadata={title:'Privacy & Reservations | Buffalo Park Restaurant',description:'How Buffalo Park Restaurant handles table reservation requests.'};
export default function PrivacyPage(){return <main style={{minHeight:'100dvh',background:'#f8f1e6',color:'#231b18',padding:'48px 20px',fontFamily:'Arial,sans-serif'}}><article style={{maxWidth:760,margin:'auto',lineHeight:1.8}}>
<Link href="/" style={{color:'#7d531e',fontWeight:700}}>← Back to Buffalo Park</Link>
<h1 style={{fontFamily:'Georgia,serif',fontSize:'clamp(34px,5vw,52px)',lineHeight:1.2}}>Privacy & reservation information</h1>
<p>When you request a table, Buffalo Park Restaurant collects your name, email address, phone number, preferred date and time, guest count, and any optional notes you provide. These details are used to review your reservation request and contact you about it.</p>
<p><strong>A reservation request is not a confirmed booking.</strong> The restaurant will contact you to confirm or decline your preferred time. If you need immediate assistance, use the restaurant's official Instagram contact.</p>
<p>Booking requests are stored securely with the website's database provider. If enabled, the restaurant also receives the details by transactional email. Your data should only be used for managing your enquiry and related follow-up, not unrelated marketing without separate permission.</p>
<p>Please avoid putting sensitive personal information in the special requests field. To request access, correction or deletion of your reservation data, contact the restaurant through its <a href="https://www.instagram.com/buffaloparkrestaurant/" target="_blank" rel="noopener noreferrer" style={{color:'#7d531e',textDecoration:'underline'}}>official Instagram profile</a>.</p>
<p>For privacy-related requests, contact the restaurant using its official contact channel. The restaurant is responsible for complying with South African privacy requirements when handling reservation data.</p>
<Link href="/" style={{display:'inline-block',marginTop:20,padding:'12px 18px',background:'#daa34e',color:'#231b18',fontWeight:700}}>Back to website</Link>
</article></main>}
