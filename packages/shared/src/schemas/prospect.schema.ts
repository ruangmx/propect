import { z } from 'zod';
import { PaginationQuerySchema } from './pagination.schema.js';

export const LeadStatusEnum = z.enum([
  'NOVO',
  'LIGAR',
  'DEMO_PRONTA',
  'ENVIADO',
  'RESPONDEU',
  'REUNIAO',
  'FECHOU',
  'PERDIDO',
  'SEM_RESPOSTA',
  'DESCARTADO',
]);
export type LeadStatus = z.infer<typeof LeadStatusEnum>;

export const PresencaWebEnum = z.enum([
  'SEM_SITE',
  'SO_REDE_SOCIAL',
  'TEM_SITE',
]);
export type PresencaWeb = z.infer<typeof PresencaWebEnum>;

export const TipoInteracaoEnum = z.enum([
  'MENSAGEM_ENVIADA',
  'FOLLOW_UP',
  'RESPOSTA',
  'LIGACAO',
  'REUNIAO',
  'MUDANCA_STATUS',
  'NOTA',
]);
export type TipoInteracao = z.infer<typeof TipoInteracaoEnum>;

export const DemoTemplateEnum = z.enum(['barbearia', 'hamburgueria']);
export type DemoTemplate = z.infer<typeof DemoTemplateEnum>;

export const DemoServicoSchema = z.object({
  nome: z.string().trim().min(1).max(120),
  descricao: z.string().trim().min(1).max(300),
  preco: z.string().trim().max(40).optional(),
});
export type DemoServico = z.infer<typeof DemoServicoSchema>;

export const DemoDadosSchema = z.object({
  titulo: z.string().trim().min(2).max(140),
  subtitulo: z.string().trim().min(2).max(240),
  descricao: z.string().trim().min(10).max(1200),
  servicos: z.array(DemoServicoSchema).min(1).max(8),
  diferenciais: z.array(z.string().trim().min(2).max(120)).min(1).max(6),
  chamadaAcao: z.string().trim().min(2).max(100),
  horarioFuncionamento: z.string().trim().min(2).max(140),
  corPrimaria: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Cor primária deve ser hexadecimal (#RRGGBB).'),
  corDestaque: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Cor de destaque deve ser hexadecimal (#RRGGBB).'),
});
export type DemoDados = z.infer<typeof DemoDadosSchema>;

export const DemoSchema = z.object({
  id: z.string().uuid(),
  leadId: z.string().uuid(),
  template: DemoTemplateEnum,
  dados: DemoDadosSchema,
  logoUrl: z.string().nullable(),
  publicadaEm: z.coerce.date().nullable(),
  visualizacoes: z.number().int().nonnegative(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Demo = z.infer<typeof DemoSchema>;

export const GenerateDemoInputSchema = z.object({
  template: DemoTemplateEnum.optional(),
});
export type GenerateDemoInput = z.infer<typeof GenerateDemoInputSchema>;

export const UpdateDemoSchema = z.object({
  template: DemoTemplateEnum.optional(),
  dados: DemoDadosSchema.optional(),
  logoUrl: z
    .string()
    .trim()
    .url('Informe uma URL válida para a logo.')
    .refine((val) => val.startsWith('https://'), 'A URL da logo deve usar HTTPS.')
    .nullable()
    .optional(),
});
export type UpdateDemoInput = z.infer<typeof UpdateDemoSchema>;

export const PublicDemoResponseSchema = z.object({
  slug: z.string(),
  template: DemoTemplateEnum,
  dados: DemoDadosSchema,
  logoUrl: z.string().nullable(),
  visualizacoes: z.number().int().nonnegative(),
  negocio: z.object({
    nome: z.string(),
    nicho: z.string(),
    endereco: z.string().nullable(),
    bairro: z.string().nullable(),
    telefone: z.string().nullable(),
    googleMapsUri: z.string().nullable(),
    instagram: z.string().nullable(),
    nota: z.number().nullable(),
    totalAvaliacoes: z.number().int().nullable(),
  }),
});
export type PublicDemoResponse = z.infer<typeof PublicDemoResponseSchema>;

export const NICHOS_SUGERIDOS = [
  'barbearia',
  'hamburgueria',
  'pet shop',
  'advocacia',
  'contabilidade',
  'clínica odontológica',
  'estética',
  'oficina mecânica',
] as const;

export const RegiaoSchema = z.object({
  id: z.string().uuid(),
  nome: z.string(),
  cidade: z.string(),
  uf: z.string().length(2),
  lat: z.number(),
  lng: z.number(),
  raioMetros: z.number().int().positive(),
  ativa: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Regiao = z.infer<typeof RegiaoSchema>;

export const BuscaSchema = z.object({
  id: z.string().uuid(),
  nicho: z.string(),
  regiaoId: z.string().uuid(),
  regiao: RegiaoSchema.optional(),
  totalEncontrado: z.number().int().nonnegative(),
  totalNovos: z.number().int().nonnegative(),
  chamadasApi: z.number().int().nonnegative(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Busca = z.infer<typeof BuscaSchema>;

export const CreateBuscaSchema = z.object({
  nicho: z
    .string()
    .trim()
    .min(2, 'Informe o nicho com pelo menos 2 caracteres.')
    .max(100, 'O nicho deve ter no máximo 100 caracteres.'),
  regiaoIds: z
    .array(z.string().uuid('ID de região inválido.'))
    .min(1, 'Selecione pelo menos uma região para buscar.')
    .max(14, 'Selecione no máximo 14 regiões por vez.'),
});
export type CreateBuscaInput = z.infer<typeof CreateBuscaSchema>;

export const CreateBuscaResultSchema = z.object({
  nicho: z.string(),
  totalRegioes: z.number().int().nonnegative(),
  totalEncontrado: z.number().int().nonnegative(),
  totalSemSiteOuRede: z.number().int().nonnegative(),
  totalNovos: z.number().int().nonnegative(),
  totalDuplicados: z.number().int().nonnegative(),
  totalComSiteProprio: z.number().int().nonnegative(),
  totalDescartados: z.number().int().nonnegative(),
  chamadasApi: z.number().int().nonnegative(),
  buscas: z.array(BuscaSchema),
});
export type CreateBuscaResult = z.infer<typeof CreateBuscaResultSchema>;

export const InteracaoSchema = z.object({
  id: z.string().uuid(),
  leadId: z.string().uuid(),
  tipo: TipoInteracaoEnum,
  conteudo: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Interacao = z.infer<typeof InteracaoSchema>;

export const CreateInteracaoSchema = z.object({
  tipo: TipoInteracaoEnum,
  conteudo: z
    .string()
    .trim()
    .min(1, 'Informe o conteúdo da interação.')
    .max(2000, 'O conteúdo deve ter no máximo 2000 caracteres.')
    .optional(),
});
export type CreateInteracaoInput = z.infer<typeof CreateInteracaoSchema>;

export const LeadSchema = z.object({
  id: z.string().uuid(),
  placeId: z.string(),
  nome: z.string(),
  nicho: z.string(),
  endereco: z.string().nullable(),
  regiaoId: z.string().uuid().nullable(),
  regiao: RegiaoSchema.nullable().optional(),
  telefone: z.string().nullable(),
  ehCelular: z.boolean(),
  website: z.string().nullable(),
  instagram: z.string().nullable(),
  presencaWeb: PresencaWebEnum,
  nota: z.number().nullable(),
  totalAvaliacoes: z.number().int().nullable(),
  googleMapsUri: z.string().nullable(),
  status: LeadStatusEnum,
  slug: z.string().nullable(),
  proximoContatoEm: z.coerce.date().nullable(),
  motivoPerda: z.string().nullable(),
  observacoes: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  interacoes: z.array(InteracaoSchema).optional(),
  demo: DemoSchema.nullable().optional(),
});
export type Lead = z.infer<typeof LeadSchema>;

export const LeadFilterQuerySchema = PaginationQuerySchema.extend({
  status: LeadStatusEnum.optional(),
  nicho: z.string().trim().min(1).optional(),
  regiaoId: z.string().uuid().optional(),
  presencaWeb: PresencaWebEnum.optional(),
  search: z.string().trim().min(1).optional(),
});
export type LeadFilterQuery = z.infer<typeof LeadFilterQuerySchema>;

export const UpdateLeadStatusSchema = z.object({
  status: LeadStatusEnum,
  motivoPerda: z
    .string()
    .trim()
    .max(500, 'O motivo da perda deve ter no máximo 500 caracteres.')
    .optional(),
  observacoes: z
    .string()
    .trim()
    .max(2000, 'As observações devem ter no máximo 2000 caracteres.')
    .optional(),
});
export type UpdateLeadStatusInput = z.infer<typeof UpdateLeadStatusSchema>;

export const RegistrarEnvioWhatsappSchema = z.object({
  mensagem: z
    .string()
    .trim()
    .min(1, 'A mensagem não pode estar vazia.')
    .max(2000, 'A mensagem deve ter no máximo 2000 caracteres.')
    .optional(),
});
export type RegistrarEnvioWhatsappInput = z.infer<typeof RegistrarEnvioWhatsappSchema>;

export const RegistrarEnvioWhatsappResultSchema = z.object({
  lead: LeadSchema,
  whatsappUrl: z.string().url(),
  mensagem: z.string(),
});
export type RegistrarEnvioWhatsappResult = z.infer<typeof RegistrarEnvioWhatsappResultSchema>;
