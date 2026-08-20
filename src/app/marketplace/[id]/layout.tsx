import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';

interface Props {
  params: { id: string };
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = params;

  // Fetch listing data
  const { data: listing } = await supabase
    .from('listings')
    .select('title, description, image_url, price')
    .eq('id', id)
    .single();

  if (!listing) {
    return {
      title: 'Listing Not Found | IIML Connect',
    };
  }

  const title = `${listing.title} - ₹${listing.price} | IIML Connect`;
  const description = listing.description || `Check out this listing on IIML Connect Marketplace.`;
  const imageUrl = listing.image_url || 'https://iiml-connect.vercel.app/placeholder.png'; // Fallback image if any

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://iiml-connect.vercel.app/marketplace/${id}`,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: listing.title,
        },
      ],
      siteName: 'IIML Connect',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default function MarketplaceDetailLayout({ children }: Props) {
  return <>{children}</>;
}
