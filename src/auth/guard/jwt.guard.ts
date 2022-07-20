import { AuthGuard } from '@nestjs/passport'

export class JwtGuard extends AuthGuard('jwt') {
  // eslint-disable-next-line no-useless-constructor
  constructor () {
    super()
  }
}
