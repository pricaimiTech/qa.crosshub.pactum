import {
	appointmentsBusiness,
	assertTs,
	authBusiness,
	availabilityBuilder,
	describeName,
	packageBuilder,
	personBuilder,
	professionalBuilder,
	serviceBuilder,
	serviceProfessionalLinkBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import getPackageLedger from "@core/services/appointments/getPackageLedger.service"
import patchUpdateAppointmentStatus from "@core/services/appointments/patchUpdateAppointmentStatus.service"
import postCreateAppointment from "@core/services/appointments/postCreateAppointment.service"
import postCreatePackage from "@core/services/appointments/postCreatePackage.service"
import postCreatePerson from "@core/services/people/postCreatePerson.service"
import postExceptionalRestore from "@core/services/appointments/postExceptionalRestore.service"
import postSellPackage from "@core/services/appointments/postSellPackage.service"
import putSaveSettings from "@core/services/appointments/putSaveSettings.service"
import { packagesAG31b } from "@appointments-data/packages.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let contractId: string
	let appointmentId: string

	before(
		"Agendamento pago por pacote, cancelado com a devolução automática desligada",
		async () => {
			adminParams = await authBusiness.loginAsTenantAdmin(
				`${process.env.TENANT_SLUG}`,
				`${process.env.TENANT_EMAIL}`,
				`${process.env.TENANT_PASSWORD}`,
				packagesAG31b.loginParams,
			)

			await appointmentsBusiness.cleanupByPrefix(
				packagesAG31b.casePrefix,
				adminParams,
			)

			await putSaveSettings(
				{
					timezone: packagesAG31b.timezone,
					cancellationNoticeHours: 24,
					restoreCreditOnLateCancellation: false,
					restoreCreditOnNoShow: false,
					restoreCreditOnAdminCancellation: false,
				},
				packagesAG31b.paramsDefault200(adminParams.token),
			)

			const bookable = await appointmentsBusiness.createBookableService(
				serviceBuilder.withName(packagesAG31b.casePrefix).build(),
				professionalBuilder.withName(packagesAG31b.casePrefix).build(),
				serviceProfessionalLinkBuilder
					.withDurationMinutes(packagesAG31b.durationMinutes)
					.withIntervalMinutes(0)
					.withCapacity(packagesAG31b.capacity)
					.build(),
				availabilityBuilder
					.reset()
					.withRule(
						packagesAG31b.weekday,
						packagesAG31b.startTime,
						packagesAG31b.endTime,
					)
					.build(),
				adminParams,
			)

			const person = await postCreatePerson(
				personBuilder
					.withName(packagesAG31b.casePrefix)
					.withEmail(packagesAG31b.casePrefix)
					.build(),
				packagesAG31b.paramsDefault201(adminParams.token),
			)

			const createdPackage = await postCreatePackage(
				packageBuilder
					.withName(packagesAG31b.packageName)
					.withCredits(packagesAG31b.priceCents, packagesAG31b.totalCredits)
					.withService(bookable.serviceId, packagesAG31b.creditsPerSession)
					.build(),
				packagesAG31b.paramsDefault201(adminParams.token),
			)

			contractId = (
				await postSellPackage(
					person.json.id,
					{ packageId: createdPackage.json.id },
					packagesAG31b.paramsDefault201(adminParams.token),
				)
			).json.id

			const slot = await appointmentsBusiness.firstAdminSlot(
				bookable.serviceId,
				packagesAG31b.date,
				packagesAG31b.paramsDefault200(adminParams.token),
			)

			appointmentId = (
				await postCreateAppointment(
					{
						personId: person.json.id,
						serviceId: bookable.serviceId,
						startsAt: slot.startsAt,
						packageContractId: contractId,
					},
					packagesAG31b.paramsDefault201(adminParams.token),
				)
			).json.id

			await patchUpdateAppointmentStatus(
				appointmentId,
				{ status: "cancelled_by_admin", reason: packagesAG31b.cancelReason },
				packagesAG31b.paramsDefault200(adminParams.token),
			)
		},
	)

	it("[AG-31b-F] - Restauração excepcional devolve o crédito, prefixa o motivo e fecha o saldo", async () => {
		const { json } = await postExceptionalRestore(
			appointmentId,
			{ reason: packagesAG31b.restoreReason },
			packagesAG31b.paramsDefault201(adminParams.token),
		)

		assertTs.equal(
			json.type,
			packagesAG31b.restoreType,
			"O lançamento criado não é do tipo restore.",
		)

		assertTs.include(
			json.reason,
			packagesAG31b.expectedReasonPrefix,
			"O motivo da restauração não veio prefixado como excepcional.",
		)

		const ledger = await getPackageLedger(
			contractId,
			{},
			packagesAG31b.paramsDefault200(adminParams.token),
		)

		const last = ledger.json[ledger.json.length - 1]

		assertTs.equal(
			last.balance,
			packagesAG31b.expectedBalanceAfterRestore,
			"O saldo não voltou ao total de créditos depois da restauração.",
		)
	})
})
