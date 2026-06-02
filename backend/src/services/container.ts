import 'reflect-metadata';
import { container } from 'tsyringe';
import { Repository } from './_internal/Repository';
import { PathResolver } from './_internal/PathResolver';
import { ResultCache } from './_internal/ResultCache';
import { RateLimiter } from './_internal/RateLimiter';
import { ImportService } from './ImportService';
import { SetDataService } from './SetDataService';
import { CompositionService } from './CompositionService';
import { RiotApiClient } from './RiotApiClient';
import { MatchFetcher } from './_internal/MatchFetcher';
import { CompAnalyzer } from './_internal/CompAnalyzer';
import { MetaService } from './MetaService';

container.registerSingleton(Repository);
container.registerSingleton(PathResolver);
container.registerSingleton(ResultCache);
container.registerSingleton(RateLimiter);
container.registerSingleton(ImportService);
container.registerSingleton(SetDataService);
container.registerSingleton(CompositionService);
container.registerSingleton(RiotApiClient);
container.registerSingleton(MatchFetcher);
container.registerSingleton(CompAnalyzer);
container.registerSingleton(MetaService);

container.register('RIOT_API_KEY', { useValue: process.env.RIOT_API_KEY || '' });

export { container };
