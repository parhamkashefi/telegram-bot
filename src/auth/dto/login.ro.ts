import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class LoginRO {
  @ApiProperty()
  @Expose()
  access_token: string;
}
