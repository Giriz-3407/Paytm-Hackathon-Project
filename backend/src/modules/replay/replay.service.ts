import { AppError } from '../../utils/app-error';
import { replayRepository } from './replay.repository';
import { toScenarioDto, type ReplayScenarioDto } from './replay.types';

export const replayService = {
  async listScenarios(): Promise<ReplayScenarioDto[]> {
    return (await replayRepository.listScenarios()).map(toScenarioDto);
  },

  async getScenario(id: string, asOf?: string): Promise<ReplayScenarioDto> {
    const row = await replayRepository.findScenario(id, asOf ? new Date(asOf) : undefined);
    if (!row) throw AppError.notFound(`Replay scenario ${id} not found`);
    return toScenarioDto(row);
  },
};
