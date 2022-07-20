import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthDto } from './dto/auth.dto'
import { UserDto } from './dto/user.dto'

@Controller('auth')
export class AuthController {
  // eslint-disable-next-line no-useless-constructor
  constructor (private authService: AuthService) {}

  @Post('signup')
  signup (@Body() dto: UserDto) {
    return this.authService.signup(dto)
  }

  @HttpCode(HttpStatus.OK)
  @Post('signin')
  signin (@Body() dto: AuthDto) {
    return this.authService.signin(dto)
  }
}
