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
import postCreateAppointment from "@core/services/appointments/postCreateAppointment.service"
import postCreatePackage from "@core/services/appointments/postCreatePackage.service"
import postCreatePerson from "@core/services/people/postCreatePerson.service"
import postSellPackage from "@core/services/appointments/postSellPackage.service"
import { packagesAG31 } from "@appointments-data/packages.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let contractId: string

	before("Pacote de 10 créditos vendido e um agendamento pago por ele", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			packagesAG31.loginParams,
		)

		await appointmentsBusiness.cleanupByPrefix(packagesAG31.casePrefix, adminParams)

		const bookable = await appointmentsBusiness.createBookableService(
			serviceBuilder.withName(packagesAG31.casePrefix).build(),
			professionalBuilder.withName(packagesAG31.casePrefix).build(),
			serviceProfessionalLinkBuilder
				.withDurationMinutes(packagesAG31.durationMinutes)
				.withIntervalMinutes(0)
				.withCapacity(packagesAG31.capacity)
				.build(),
			availabilityBuilder
				.reset()
				.withRule(
					packagesAG31.weekday,
					packagesAG31.startTime,
					packagesAG31.endTime,
				)
				.build(),
			adminParams,
		)

		const person = await postCreatePerson(
			personBuilder
				.withName(packagesAG31.casePrefix)
				.withEmail(packagesAG31.casePrefix)
				.build(),
			packagesAG31.paramsDefault201(adminParams.token),
		)

		const createdPackage = await postCreatePackage(
			packageBuilder
				.withName(packagesAG31.packageName)
				.withCredits(packagesAG31.priceCents, packagesAG31.totalCredits)
				.withService(bookable.serviceId, packagesAG31.creditsPerSession)
				.build(),
			packagesAG31.paramsDefault201(adminParams.token),
		)

		const contract = await postSellPackage(
			person.json.id,
			{ packageId: createdPackage.json.id },
			packagesAG31.paramsDefault201(adminParams.token),
		)

		contractId = contract.json.id

		const slot = await appointmentsBusiness.firstAdminSlot(
			bookable.serviceId,
			packagesAG31.date,
			packagesAG31.paramsDefault200(adminParams.token),
		)

		await postCreateAppointment(
			{
				personId: person.json.id,
				serviceId: bookable.serviceId,
				startsAt: slot.startsAt,
				packageContractId: contractId,
			},
			packagesAG31.paramsDefault201(adminParams.token),
		)
	})

	it("[AG-31-F] - Extrato do pacote credita na venda, debita no agendamento e fecha o saldo", async () => {
		const { json } = await getPackageLedger(
			contractId,
			{},
			packagesAG31.paramsDefault200(adminParams.token),
		)

		const grants = json.filter(
			(entry: { type: string }) => entry.type === packagesAG31.grantType,
		)
		const consumes = json.filter(
			(entry: { type: string }) => entry.type === packagesAG31.consumeType,
		)

		assertTs.equal(
			grants[0].deltaCredits,
			packagesAG31.expectedGrantDelta,
			"A venda do pacote não creditou os 10 créditos.",
		)

		assertTs.equal(
			consumes[0].deltaCredits,
			packagesAG31.expectedConsumeDelta,
			"O agendamento pago por pacote não debitou exatamente um crédito.",
		)

		assertTs.equal(
			consumes[0].balance,
			packagesAG31.expectedBalanceAfterConsume,
			"O saldo do extrato não fecha depois do consumo.",
		)
	})
})
