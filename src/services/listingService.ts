import { ListingDraft, PublishedListing } from "@/types";
import { supabase } from "@/lib/supabase";
import { generateId } from "@/utils/format";

export interface IListingService {
  uploadImage(file: File): Promise<{ remoteUrl: string }>;
  publishListing(draft: ListingDraft, imageUrls: string[]): Promise<PublishedListing>;
}

class SupabaseListingService implements IListingService {
  async uploadImage(file: File): Promise<{ remoteUrl: string }> {
    // Generate a unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `listings/${fileName}`;

    const { data, error } = await supabase.storage
      .from('marketplace-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error("Storage upload error:", error);
      throw new Error("Failed to upload image: " + error.message);
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('marketplace-images')
      .getPublicUrl(filePath);

    return { remoteUrl: publicUrlData.publicUrl };
  }

  async publishListing(
    draft: ListingDraft,
    imageUrls: string[]
  ): Promise<PublishedListing> {
    if (!draft.category || !draft.condition || !draft.pickupLocationType) {
      throw new Error("Listing is missing required fields.");
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      throw new Error("You must be logged in to post a listing.");
    }

    const user = sessionData.session.user;
    const metadata = user.user_metadata || {};
    const fullName = metadata.full_name || metadata.name || 'Student';

    const insertData = {
      seller_id: user.id,
      title: draft.title.trim(),
      description: draft.description.trim(),
      price: Number(draft.price),
      category: draft.category,
      condition: draft.condition,
      pickup: draft.pickupLocationType,
      image_url: imageUrls[0] || '', // Using first image as cover
      location: draft.customPickupNote || draft.pickupLocationType,
      seller_name: fullName,
      seller_batch: 'Verified Student' // Could be updated based on profile builder
    };

    const { data, error } = await supabase
      .from('listings')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error("Database insert error:", error);
      throw new Error("Failed to publish listing: " + error.message);
    }

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      category: data.category as any,
      condition: data.condition as any,
      tags: draft.tags,
      price: Number(data.price),
      negotiable: draft.negotiable,
      pickupLocationType: data.pickup as any,
      customPickupNote: data.location,
      imageUrls,
      coverImageUrl: data.image_url,
      seller: {
        name: data.seller_name,
        batch: data.seller_batch,
      },
      createdAt: data.created_at,
    };
  }
}

export const listingService: IListingService = new SupabaseListingService();
