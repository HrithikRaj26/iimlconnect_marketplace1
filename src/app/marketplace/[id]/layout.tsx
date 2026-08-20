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
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 600,
          alt: listing.title,
        },
      ],
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
