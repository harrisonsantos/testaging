import { Test, TestingModule } from '@nestjs/testing';
import { EvaluationService } from './evaluation.service';
import { EvaluationRepository } from './evaluation.repository';
import { BiomechanicalCalculationsService } from './biomechanical-calculations.service';
import { NotFoundException } from '@nestjs/common';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { Evaluation } from './entities/evaluation.entity';

const mockEvaluationRepository = {
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
};

const mockBiomechanicalCalculationsService = {
  calculateBiomechanicalIndicators: jest.fn(),
  calculateAge: jest.fn(),
};

describe('EvaluationService', () => {
  let service: EvaluationService;
  let repository: EvaluationRepository;
  let biomechanicalService: BiomechanicalCalculationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvaluationService,
        {
          provide: EvaluationRepository,
          useValue: mockEvaluationRepository,
        },
        {
          provide: BiomechanicalCalculationsService,
          useValue: mockBiomechanicalCalculationsService,
        },
      ],
    }).compile();

    service = module.get<EvaluationService>(EvaluationService);
    repository = module.get<EvaluationRepository>(EvaluationRepository);
    biomechanicalService = module.get<BiomechanicalCalculationsService>(
      BiomechanicalCalculationsService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an evaluation', async () => {
      const createEvaluationDto: Partial<CreateEvaluationDto> = { type: 'TUG' };
      const createdEvaluation = { id: 1, ...createEvaluationDto };

      mockEvaluationRepository.create.mockResolvedValue(createdEvaluation);
      // Mock findOne which is called after create
      jest.spyOn(service, 'findOne').mockResolvedValue(createdEvaluation as any);


      const result = await service.create(createEvaluationDto);

      expect(mockEvaluationRepository.create).toHaveBeenCalledWith(
        { ...createEvaluationDto, sensorData: [] },
        { include: expect.any(Array) },
      );
      expect(service.findOne).toHaveBeenCalledWith(createdEvaluation.id);
      expect(result).toEqual(createdEvaluation);
    });
  });

  describe('findAll', () => {
    it('should return an array of evaluations', async () => {
      const evaluations = [{ id: 1, toJSON: () => ({ id: 1 }) }];
      mockEvaluationRepository.findAll.mockResolvedValue(evaluations);
      const result = await service.findAll();
      expect(result).toEqual(evaluations.map(e => e.toJSON()));
      expect(mockEvaluationRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single evaluation', async () => {
      const evaluation = { id: 1 };
      mockEvaluationRepository.findById.mockResolvedValue(evaluation);
      const result = await service.findOne(1);
      expect(result).toEqual(evaluation);
      expect(mockEvaluationRepository.findById).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException if evaluation not found', async () => {
      mockEvaluationRepository.findById.mockResolvedValue(null);
      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAnalytics', () => {
    it('should return analytics for an evaluation', async () => {
      const evaluation = {
        id: 1,
        type: 'TUG',
        date: new Date(),
        patient: { dateOfBirth: new Date() },
        sensorData: [{ time: new Date(), accel_x: 1, accel_y: 1, accel_z: 1 }],
      };
      const analysis = { indicators: [], classification: 'Bom', summary: {} };

      mockEvaluationRepository.findOne.mockResolvedValue(evaluation);
      mockBiomechanicalCalculationsService.calculateAge.mockReturnValue(30);
      mockBiomechanicalCalculationsService.calculateBiomechanicalIndicators.mockReturnValue(analysis);

      const result = await service.getAnalytics(1);

      expect(result).toEqual(analysis);
      expect(mockEvaluationRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        include: expect.any(Array),
        order: expect.any(Array),
      });
      expect(mockBiomechanicalCalculationsService.calculateBiomechanicalIndicators).toHaveBeenCalled();
    });

    it('should throw NotFoundException if evaluation for analytics not found', async () => {
      mockEvaluationRepository.findOne.mockResolvedValue(null);
      await expect(service.getAnalytics(1)).rejects.toThrow(NotFoundException);
    });
  });
});
