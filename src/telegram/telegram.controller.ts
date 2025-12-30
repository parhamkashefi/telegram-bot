import { Controller} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Prices')
@Controller('prices')
export class TelegramController {}
