// pages/api/users.js (for Pages Router)
import pool from "@/lib/postgress/postgress"; // Adjust path as needed
import { NextApiRequest, NextApiResponse } from "next";
import { NextResponse } from "next/server";
import jwt from 'jsonwebtoken'

export async function POST(req: Request, res: Response) {
  const { email, password } = await req.json();
  
  try {
    const client = await pool.connect();
    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
 
    const user = userResult.rows[0];
     
     if (!user) {
      // Use a generic message for security
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }
   const tokenData  = 
   {
    id:user.id,
    email:user.email,
    role:user.role,
    branch_id:user.branch_id
   }
   const token = await jwt.sign(tokenData, process.env.JWT_SECRET_KEY!, {expiresIn:"1h"})
   const response = NextResponse.json({
    message:"Login Successful",
    success:true,
   })
   response.cookies.set("token",token,{httpOnly:true,path:'/'})
    return response
  } catch (error) {
    console.log(error);
  }
}
