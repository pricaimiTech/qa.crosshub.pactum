/**
 * Contratos do domínio `privacy` gerados de `openapi.json`.
 * Regerar com `npm run generate:api`.
 */
export interface IPrivacyProfessional {
	id: string
	email: string
	isActive: boolean
	/** O Administrador Principal tem acesso permanente e não pode ser alterado. */
	isPrimaryAdmin: boolean
	canViewSensitiveData: boolean
}

export interface IPrivacySettings {
	tenantId: string
	sensitiveDataRetentionDays: number
	createdAt: string
	updatedAt: string
}

export interface IRetentionRun {
	/** Quantas respostas sensíveis expiradas foram apagadas. */
	deletedSubmissions: number
	/** Política aplicada nesta execução. */
	retentionDays: number
}

export interface ISensitiveDataAccess {
	id: string
	canViewSensitiveData: boolean
}

export interface ISetSensitiveDataAccess {
	/** Se o profissional pode visualizar respostas sensíveis. */
	allowed: boolean
}

export interface IUpdatePrivacySettings {
	/** Por quantos dias as respostas de formulários marcados como sensíveis são
mantidas antes de a rotina de retenção apagá-las. */
	sensitiveDataRetentionDays: number
}
