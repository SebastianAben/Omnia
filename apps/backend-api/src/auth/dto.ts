import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;

  @IsString()
  @IsOptional()
  device_id?: string;
}

export type CurrentUser = {
  id: string;
  full_name: string;
  role_code: string;
  branch_id?: string;
};
