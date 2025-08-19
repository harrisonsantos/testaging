import { Model, FindOptions, CreateOptions, UpdateOptions, DestroyOptions, Sequelize } from 'sequelize';

export abstract class BaseRepository<T extends Model> {
  constructor(protected readonly model: typeof Model & (new () => T)) {}

  public get sequelize(): Sequelize {
    if (!this.model.sequelize) {
      throw new Error('Sequelize instance is not available.');
    }
    return this.model.sequelize;
  }

  async findById(id: string | number, options?: FindOptions): Promise<T | null> {
    return this.model.findByPk(id, options);
  }

  async findOne(options?: FindOptions): Promise<T | null> {
    return this.model.findOne(options);
  }

  async findAll(options?: FindOptions): Promise<T[]> {
    return this.model.findAll(options);
  }

  async create(data: any, options?: CreateOptions): Promise<T> {
    return this.model.create(data, options);
  }

  async update(data: any, options: UpdateOptions): Promise<[number]> {
    return this.model.update(data, options);
  }

  async destroy(options: DestroyOptions): Promise<number> {
    return this.model.destroy(options);
  }
}