import { NextResponse } from "next/server";
import { Resend } from "resend";

// Resend SDK will read process.env.RESEND_API_KEY
const resend = new Resend(process.env.RESEND_API_KEY || "re_mock_key_for_compilation");

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ventureName, ownerName, recipientEmail, isUpdate } = body;

    if (!ventureName || !ownerName || !recipientEmail) {
      return NextResponse.json(
        { error: "Missing required parameters: ventureName, ownerName, recipientEmail" },
        { status: 400 }
      );
    }

    const emailSubject = isUpdate 
      ? `✨ Profile Updates Approved: "${ventureName}" is updated!`
      : `Congratulations! Your venture "${ventureName}" is now LIVE!`;

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="font-size: 40px;">${isUpdate ? "✨" : "🎉"}</span>
        </div>
        <h2 style="color: #ea580c; font-size: 22px; font-weight: 800; text-align: center; margin-top: 0; margin-bottom: 8px;">
          ${isUpdate ? "Profile Updates Approved!" : "Venture Approved!"}
        </h2>
        <p style="font-size: 11px; font-weight: 850; text-transform: uppercase; letter-spacing: 0.1em; color: #9ca3af; text-align: center; margin-top: 0; margin-bottom: 24px;">IIML Student Venture Hub</p>
        
        <p style="font-size: 14px; color: #374151; line-height: 1.6; margin-bottom: 16px;">Dear <strong>${ownerName}</strong>,</p>
        
        ${isUpdate ? `
          <p style="font-size: 14px; color: #374151; line-height: 1.6; margin-bottom: 16px;">
            Great news! The recent changes and profile updates you made to your student venture <strong>"${ventureName}"</strong> have been reviewed and approved by the moderation admin.
          </p>
          <p style="font-size: 14px; color: #374151; line-height: 1.6; margin-bottom: 16px;">
            The new details have been applied live and are now visible to everyone on the <strong>IIM Lucknow Venture Hub</strong> directory!
          </p>
        ` : `
          <p style="font-size: 14px; color: #374151; line-height: 1.6; margin-bottom: 16px;">
            Great news! Your student venture <strong>"${ventureName}"</strong> has been reviewed, approved by the moderation admin, and is now successfully live on the <strong>IIM Lucknow Venture Hub</strong> directory!
          </p>
        `}
        
        <div style="background-color: #f9fafb; border: 1px solid #f3f4f6; padding: 16px; border-radius: 12px; margin-bottom: 20px;">
          <p style="font-size: 13px; font-weight: 700; color: #4b5563; margin-top: 0; margin-bottom: 8px;">What you can do next:</p>
          <ul style="font-size: 13px; color: #4b5563; padding-left: 20px; margin-top: 0; margin-bottom: 0; line-height: 1.6;">
            <li>Inspect your live profile on the Discover directory board.</li>
            <li>Broadcast news, flash sales, or late-night events to the campus feed.</li>
            <li>Gather rating reviews and direct inquiries from students.</li>
          </ul>
        </div>
        
        <div style="background-color: #fff7ed; border: 1px solid #ffedd5; padding: 16px; border-radius: 12px; margin-bottom: 24px;">
          <p style="font-size: 13px; font-weight: 800; color: #c2410c; margin-top: 0; margin-bottom: 8px;">📢 Pro-Tip: Notify the Campus!</p>
          <p style="font-size: 12.5px; color: #ea580c; margin-top: 0; margin-bottom: 0; line-height: 1.5; font-weight: 600;">
            Now that your profile details are approved and updated, we highly recommend publishing a new update or promotion post in the <strong>Community Feed</strong> to notify all students on campus about your latest details or menu offerings!
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 32px; margin-bottom: 16px;">
          <a href="http://localhost:3000/ventures" target="_blank" style="background-color: #ea580c; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-size: 13px; font-weight: 900; display: inline-block; box-shadow: 0 4px 6px -1px rgba(234,88,12,0.2);">
            Open Venture Hub Dashboard 🚀
          </a>
        </div>
        
        <hr style="border: 0; border-top: 1px solid #f3f4f6; margin-top: 36px; margin-bottom: 20px;" />
        <p style="font-size: 11px; color: #9ca3af; text-align: center; line-height: 1.5; margin: 0;">
          This is an automated system notification from IIML Connect.<br />
          Indian Institute of Management Lucknow Campus Connect.
        </p>
      </div>
    `;

    // Call Resend to send the congratulatory email
    const emailResponse = await resend.emails.send({
      from: "IIML Connect <onboarding@resend.dev>",
      to: recipientEmail,
      subject: emailSubject,
      html: emailHtml,
    });

    if (emailResponse.error) {
      console.error("Resend API Error details:", emailResponse.error);
      return NextResponse.json(
        { error: emailResponse.error.message || "Failed to send email via Resend" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, id: emailResponse.data?.id });
  } catch (error: any) {
    console.error("Resend API Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
