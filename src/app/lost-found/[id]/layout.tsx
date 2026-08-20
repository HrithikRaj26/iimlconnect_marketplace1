import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';

interface Props {
  params: { id: string };
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = params;

  // Fetch report data
  const { data: report } = await supabase
    .from('lost_found_reports')
    .select('type, category, description, photo_url')
    .eq('id', id)
    .single();

  if (!report) {
    return {
      title: 'Report Not Found | IIML Connect',
    };
  }

  const isLost = report.type === 'lost';
  const typeLabel = isLost ? 'Lost' : 'Found';
  const title = `${typeLabel}: ${report.category} | IIML Connect`;
  
  const description = report.description || `A ${typeLabel.toLowerCase()} item was reported on IIML Connect.`;
  const imageUrl = report.photo_url || 'https://iiml-connect.vercel.app/placeholder.png'; 

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://iiml-connect.vercel.app/lost-found/${id}`,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: report.category,
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

export default function LostFoundDetailLayout({ children }: Props) {
  return <>{children}</>;
}
