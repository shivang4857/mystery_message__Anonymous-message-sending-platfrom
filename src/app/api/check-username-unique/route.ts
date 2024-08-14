import dbConnect from '@/lib/dbConnect';
import UserModel from '../../model/User';
import { z } from 'zod';
import { usernameValidation } from '../../schema/signUpSchema';

const UsernameQuerySchema = z.object({
  username: usernameValidation,
});

export async function GET(request: Request) {
  await dbConnect();

  try {
    const { searchParams } = new URL(request.url);
    const queryParams = {
      username: searchParams.get('username'),
    };

    console.log('Query Params:', queryParams);

    // Validate query parameters using Zod schema
    const result = UsernameQuerySchema.safeParse(queryParams);

    if (!result.success) {
      const usernameErrors = result.error.format().username?._errors || [];
      return new Response(
        JSON.stringify({
          success: false,
          message:
            usernameErrors.length > 0
              ? usernameErrors.join(', ')
              : 'Invalid query parameters',
        }),
        { status: 400 }
      );
    }

    const { username } = result.data;

    // Check if the username exists and is verified
    const existingVerifiedUser = await UserModel.findOne({
      username,
      isVerified: true,
    });

    console.log('DB Query Result:', existingVerifiedUser);

    if (existingVerifiedUser) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Username is already taken',
        }),
        { status: 200 }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Username is unique',
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error checking username:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Error checking username',
      }),
      { status: 500 }
    );
  }
}
