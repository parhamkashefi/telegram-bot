import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { plainToInstance } from 'class-transformer';
import { Coin, CoinDocument } from './schema/coin.schema';
import { CoinRo } from './dto/coin.ro';
import { CoinDto } from './dto/coin.dto';
import { TabloTalaService } from '../tablotala/tablotala.service';

@Injectable()
export class CoinService {
  constructor(
    @InjectModel(Coin.name) private readonly coinModel: Model<CoinDocument>,
    private readonly tabloTalaService: TabloTalaService,
  ) {}

  async getCoinFromDB(): Promise<CoinRo | null> {
    try {
      const newest = await this.coinModel
        .findOne()
        .sort({ createdAt: -1 })
        .lean()
        .exec();

      if (!newest) return null;

      return plainToInstance(CoinRo, newest, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      console.error('❌ Error getting newest coin from DB:', error);
      return null;
    }
  }

  async createGoldPrices(coinDto: CoinDto): Promise<CoinRo> {
    const created = await this.coinModel.create(coinDto);
    return plainToInstance(CoinRo, created.toObject(), {
      excludeExtraneousValues: true,
    });
  }

  /** Panel/auth endpoint — same HTTP refresh as the homepage scheduler. */
  async getAllCoinPrices(): Promise<CoinRo> {
    const refreshed = await this.refreshTabloTalaCoins();
    if (refreshed) return refreshed;
    const fromDb = await this.getCoinFromDB();
    if (!fromDb) {
      throw new Error('No coin price records found');
    }
    return fromDb;
  }

  /**
   * Homepage coin refresh from Tablo Tala member webservice (JSON),
   * with the public TV feed as fallback.
   */
  async refreshTabloTalaCoins(): Promise<CoinRo | null> {
    const previous = await this.coinModel.findOne().sort({ createdAt: -1 });

    try {
      const byType = await this.tabloTalaService.getPrices(8000);

      const oldCoin = byType.get('IRCOLD') || previous?.oldCoin || 0;
      const newCoin = byType.get('IRCNEW') || previous?.newCoin || 0;
      const halfCoin = byType.get('IRC2') || previous?.halfCoin || 0;
      const quarterCoin = byType.get('IRC4') || previous?.quarterCoin || 0;
      const gramCoin = byType.get('IRCGRAM') || previous?.gramCoin || 0;

      if (!oldCoin && !newCoin && !halfCoin && !quarterCoin && !gramCoin) {
        return previous
          ? plainToInstance(CoinRo, previous.toObject(), {
              excludeExtraneousValues: true,
            })
          : null;
      }

      const payload = {
        productType: 'coin',
        siteNames: ['tablotala'],
        prices: [[oldCoin], [newCoin], [halfCoin], [quarterCoin], [gramCoin]],
        weights: [[1], [1], [1], [1], [1]],
        oldCoin,
        newCoin,
        halfCoin,
        quarterCoin,
        gramCoin,
        fetchedAtUtc: new Date(),
      };

      if (!previous) {
        const created = await this.coinModel.create(payload);
        return plainToInstance(CoinRo, created.toObject(), {
          excludeExtraneousValues: true,
        });
      }

      previous.set(payload);
      await previous.save();
      return plainToInstance(CoinRo, previous.toObject(), {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      console.error('❌ Tablo Tala coin fetch failed:', error);
      return previous
        ? plainToInstance(CoinRo, previous.toObject(), {
            excludeExtraneousValues: true,
          })
        : null;
    }
  }
}
