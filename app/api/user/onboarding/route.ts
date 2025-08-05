import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const { userAddress, country, birthMonth, birthYear, isItRelated } = body;
    
    if (!userAddress || !country || !birthMonth || !birthYear || isItRelated === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await fetch('https://audata.space:8000/api/v1/users/metadata', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userAddress,
        country,
        birthMonth,
        birthYear,
        isItRelated,
      }),
    });



    return NextResponse.json({
      success: true,
      message: 'Onboarding data saved successfully',
      data: {
        userAddress,
        country,
        birthMonth,
        birthYear,
        isItRelated,
        submittedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error processing onboarding data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address parameter is required" },
        { status: 400 }
      );
    }

    const res = await fetch(`http://audata.space:8000/api/v1/users/metadata/?user_wallet_address=${walletAddress}`); 
    
    console.log(res.status, res.statusText);
    
    return NextResponse.json({ 
      success: true,
      data: res.ok ? await res.json() : null, 
    });

  } catch (error) {
    console.error("Error fetching onboarding data:", error);
    return NextResponse.json(
      { error: "Failed to fetch onboarding data" },
      { status: 500 }
    );
  }
} 