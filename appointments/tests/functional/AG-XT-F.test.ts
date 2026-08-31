import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import {
	appointmentsBusiness,
	assertTs,
	authBusiness,
	availabilityBuilder,
	describeName,
	professionalBuilder,
	serviceBuilder,
	serviceProfessionalLinkBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import getListAppointments from "@core/services/appointments/getListAppointments.service"
import getAvailability from "@core/services/appointments/getAvailability.service"
import getServices from "@core/services/appointments/getServices.service"
import { secondTenantFile } from "@shared-data/tenants.data"
import { isolationAGXT } from "@appointments-data/isolation.data"

describe(describeName.dashboard, () => {
	let firstTenantParams: IParamsDefault
	let secondTenantServiceId: string

	before("Serviço, profissional e agenda criados no tenant B", async () => {
		const secondTenant = JSON.parse(
			readFileSync(resolve(process.cwd(), secondTenantFile), "utf8"),
		)

		const secondTenantParams = await authBusiness.loginAsTenantAdmin(
			secondTenant.slug,
			secondTenant.adminEmail,
			secondTenant.adminPassword,
			isolationAGXT.loginParams,
		)

		await appointmentsBusiness.cleanupByPrefix(
			isolationAGXT.casePrefix,
			secondTenantParams,
		)

		const bookable = await appointmentsBusiness.createBookableService(
			serviceBuilder.withName(isolationAGXT.casePrefix).build(),
			professionalBuilder.withName(isolationAGXT.casePrefix).build(),
			serviceProfessionalLinkBuilder
				.withDurationMinutes(isolationAGXT.durationMinutes)
				.withIntervalMinutes(0)
				.withCapacity(isolationAGXT.capacity)
				.build(),
			availabilityBuilder
				.reset()
				.withRule(
					isolationAGXT.weekday,
					isolationAGXT.startTime,
					isolationAGXT.endTime,
				)
				.build(),
			secondTenantParams,
		)

		secondTenantServiceId = bookable.serviceId

		firstTenantParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			isolationAGXT.loginParams,
		)
	})

	it("[AG-XT-F] - Tenant A não lista nem acessa por id os registros do tenant B", async () => {
		const services = await getServices(
			isolationAGXT.paramsDefault200(firstTenantParams.token),
		)

		const leaked = services.json.filter(
			(service: { id: string }) => service.id === secondTenantServiceId,
		)

		assertTs.lengthOf(
			leaked,
			0,
			"Um serviço do tenant B apareceu na listagem do tenant A.",
		)

		await getAvailability(
			{ serviceId: secondTenantServiceId, date: isolationAGXT.date },
			isolationAGXT.paramsDefault404(firstTenantParams.token),
		)

		const appointments = await getListAppointments(
			{ from: isolationAGXT.date, to: isolationAGXT.date },
			isolationAGXT.paramsDefault200(firstTenantParams.token),
		)

		const leakedAppointments = appointments.json.filter(
			(appointment: { serviceId: string }) =>
				appointment.serviceId === secondTenantServiceId,
		)

		assertTs.lengthOf(
			leakedAppointments,
			0,
			"Um agendamento do tenant B apareceu na agenda do tenant A.",
		)
	})
})
