import { PaginationDto } from '../pagination.dto';

export interface PaginationTypeOrmResponseDto {
  page: number;
  take: number;
  skip: number;
}

export class PaginationUtility {
  constructor(private defaultPerPage: number) {}

  public parse(query: PaginationDto): PaginationTypeOrmResponseDto {
    const page = query.page ? query.page : 0;
    const take = query.per_page ? query.per_page : this.defaultPerPage;
    const skip = page ? (page - 1) * take : 0;

    return { page, take, skip };
  }
}
