import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ======== TENANT ========
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'ghmc' },
    update: {},
    create: {
      name: 'Greater Hyderabad Municipal Corporation',
      slug: 'ghmc',
      domain: 'ghmc.civicops.com',
      isActive: true,
      settings: {
        timezone: 'Asia/Kolkata',
        locale: 'en-IN',
        slaDefaults: { low: 72, medium: 48, high: 24, critical: 4 },
        features: { aiEnabled: true, webhooksEnabled: true, ragEnabled: true, mapEnabled: true },
      },
    },
  });

  console.log(`Tenant: ${tenant.name} (${tenant.id})`);

  // ======== PERMISSIONS ========
  const permissionDefs = [
    { name: 'complaint:create', resource: 'complaint', action: 'create', displayName: 'Create Complaints' },
    { name: 'complaint:view', resource: 'complaint', action: 'view', displayName: 'View Own Complaints' },
    { name: 'complaint:view_all', resource: 'complaint', action: 'view_all', displayName: 'View All Complaints' },
    { name: 'complaint:update', resource: 'complaint', action: 'update', displayName: 'Update Complaints' },
    { name: 'complaint:assign', resource: 'complaint', action: 'assign', displayName: 'Assign Complaints' },
    { name: 'complaint:resolve', resource: 'complaint', action: 'resolve', displayName: 'Resolve Complaints' },
    { name: 'complaint:reopen', resource: 'complaint', action: 'reopen', displayName: 'Reopen Complaints' },
    { name: 'complaint:reject', resource: 'complaint', action: 'reject', displayName: 'Reject Complaints' },
    { name: 'user:create', resource: 'user', action: 'create', displayName: 'Create Users' },
    { name: 'user:view', resource: 'user', action: 'view', displayName: 'View Users' },
    { name: 'user:view_all', resource: 'user', action: 'view_all', displayName: 'View All Users' },
    { name: 'user:update', resource: 'user', action: 'update', displayName: 'Update Users' },
    { name: 'user:deactivate', resource: 'user', action: 'deactivate', displayName: 'Deactivate Users' },
    { name: 'role:manage', resource: 'role', action: 'manage', displayName: 'Manage Roles' },
    { name: 'department:manage', resource: 'department', action: 'manage', displayName: 'Manage Departments' },
    { name: 'department:view', resource: 'department', action: 'view', displayName: 'View Departments' },
    { name: 'zone:manage', resource: 'zone', action: 'manage', displayName: 'Manage Zones' },
    { name: 'geography:view', resource: 'geography', action: 'view', displayName: 'View Geography' },
    { name: 'report:view', resource: 'report', action: 'view', displayName: 'View Reports' },
    { name: 'report:generate', resource: 'report', action: 'generate', displayName: 'Generate Reports' },
    { name: 'webhook:create', resource: 'webhook', action: 'create', displayName: 'Create Webhooks' },
    { name: 'webhook:update', resource: 'webhook', action: 'update', displayName: 'Update Webhooks' },
    { name: 'webhook:delete', resource: 'webhook', action: 'delete', displayName: 'Delete Webhooks' },
    { name: 'webhook:view', resource: 'webhook', action: 'view', displayName: 'View Webhooks' },
    { name: 'ai:use', resource: 'ai', action: 'use', displayName: 'Use AI Features' },
    { name: 'ai:analytics', resource: 'ai', action: 'analytics', displayName: 'View AI Analytics' },
    { name: 'audit:view', resource: 'audit', action: 'view', displayName: 'View Audit Logs' },
    { name: 'tenant:update', resource: 'tenant', action: 'update', displayName: 'Update Tenant' },
    { name: 'tenant:view', resource: 'tenant', action: 'view', displayName: 'View Tenant' },
    { name: 'system:admin', resource: 'system', action: 'admin', displayName: 'System Administration' },
  ];

  const permissions: Record<string, any> = {};
  for (const pDef of permissionDefs) {
    const p = await prisma.permission.upsert({
      where: { name_tenantId: { name: pDef.name, tenantId: tenant.id } },
      update: {},
      create: { ...pDef, tenantId: tenant.id },
    });
    permissions[p.name] = p;
  }
  console.log(`Permissions: ${Object.keys(permissions).length} created`);

  // ======== ROLES ========
  const roleDefs = [
    { name: 'SUPER_ADMIN', displayName: 'Super Admin', level: 100, perms: Object.keys(permissions) },
    { name: 'COMMISSIONER', displayName: 'Commissioner', level: 90, perms: ['complaint:view_all', 'complaint:assign', 'complaint:update', 'complaint:resolve', 'complaint:reopen', 'complaint:reject', 'user:view_all', 'user:create', 'user:update', 'user:deactivate', 'role:manage', 'department:manage', 'department:view', 'zone:manage', 'geography:view', 'report:view', 'report:generate', 'webhook:create', 'webhook:update', 'webhook:delete', 'webhook:view', 'ai:use', 'ai:analytics', 'audit:view', 'tenant:update', 'tenant:view'] },
    { name: 'ZONAL_COMMISSIONER', displayName: 'Zonal Commissioner', level: 70, perms: ['complaint:view_all', 'complaint:assign', 'complaint:update', 'complaint:resolve', 'complaint:reopen', 'user:view_all', 'department:view', 'geography:view', 'report:view', 'report:generate', 'ai:use', 'ai:analytics', 'audit:view'] },
    { name: 'DEPUTY_COMMISSIONER', displayName: 'Deputy Commissioner', level: 60, perms: ['complaint:view_all', 'complaint:assign', 'complaint:update', 'complaint:resolve', 'complaint:reopen', 'user:view', 'department:view', 'geography:view', 'report:view', 'ai:use'] },
    { name: 'WARD_OFFICER', displayName: 'Ward Officer', level: 50, perms: ['complaint:view_all', 'complaint:assign', 'complaint:update', 'complaint:resolve', 'complaint:reopen', 'user:view', 'department:view', 'geography:view', 'report:view', 'ai:use'] },
    { name: 'FIELD_SUPERVISOR', displayName: 'Field Supervisor', level: 30, perms: ['complaint:view', 'complaint:update', 'complaint:resolve', 'department:view', 'geography:view', 'ai:use'] },
    { name: 'FIELD_WORKER', displayName: 'Field Worker', level: 20, perms: ['complaint:view', 'complaint:update', 'complaint:resolve', 'geography:view'] },
    { name: 'CITIZEN', displayName: 'Citizen', level: 10, perms: ['complaint:create', 'complaint:view', 'complaint:reopen', 'ai:use'] },
  ];

  const roles: Record<string, any> = {};
  for (const rDef of roleDefs) {
    const role = await prisma.role.upsert({
      where: { name_tenantId: { name: rDef.name, tenantId: tenant.id } },
      update: {},
      create: {
        name: rDef.name,
        displayName: rDef.displayName,
        level: rDef.level,
        tenantId: tenant.id,
        isSystem: true,
      },
    });
    roles[role.name] = role;

    // Assign permissions to role
    for (const permName of rDef.perms) {
      if (permissions[permName]) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: role.id, permissionId: permissions[permName].id } },
          update: {},
          create: { roleId: role.id, permissionId: permissions[permName].id },
        });
      }
    }
  }
  console.log(`Roles: ${Object.keys(roles).length} created`);

  // ======== DEPARTMENTS ========
  const departments = [
    { name: 'Sanitation', code: 'SAN' },
    { name: 'Roads & Buildings', code: 'RB' },
    { name: 'Water Supply', code: 'WS' },
    { name: 'Drainage', code: 'DRN' },
    { name: 'Street Lighting', code: 'SL' },
    { name: 'Parks & Gardens', code: 'PG' },
  ];

  const deptRecords: Record<string, any> = {};
  for (const dept of departments) {
    const d = await prisma.department.upsert({
      where: { code_tenantId: { code: dept.code, tenantId: tenant.id } },
      update: {},
      create: { ...dept, tenantId: tenant.id },
    });
    deptRecords[d.code] = d;
  }
  console.log(`Departments: ${departments.length} created`);

  // ======== GEOGRAPHY ========
  const zones = [
    { name: 'Charminar Zone', code: 'Z01' },
    { name: 'Khairatabad Zone', code: 'Z02' },
    { name: 'Serilingampally Zone', code: 'Z03' },
    { name: 'Kukatpally Zone', code: 'Z04' },
    { name: 'Secunderabad Zone', code: 'Z05' },
    { name: 'LB Nagar Zone', code: 'Z06' },
  ];

  const zoneRecords: Record<string, any> = {};
  for (const zone of zones) {
    const z = await prisma.zone.upsert({
      where: { code_tenantId: { code: zone.code, tenantId: tenant.id } },
      update: {},
      create: { ...zone, tenantId: tenant.id },
    });
    zoneRecords[z.code] = z;
  }

  // Circles for Zone 1
  const circles = [
    { name: 'Circle 1', code: 'C01', zoneCode: 'Z01' },
    { name: 'Circle 2', code: 'C02', zoneCode: 'Z01' },
    { name: 'Circle 3', code: 'C03', zoneCode: 'Z02' },
    { name: 'Circle 4', code: 'C04', zoneCode: 'Z02' },
    { name: 'Circle 5', code: 'C05', zoneCode: 'Z03' },
    { name: 'Circle 6', code: 'C06', zoneCode: 'Z04' },
  ];

  const circleRecords: Record<string, any> = {};
  for (const circle of circles) {
    const c = await prisma.circle.upsert({
      where: { code_tenantId: { code: circle.code, tenantId: tenant.id } },
      update: {},
      create: {
        name: circle.name,
        code: circle.code,
        zoneId: zoneRecords[circle.zoneCode].id,
        tenantId: tenant.id,
      },
    });
    circleRecords[c.code] = c;
  }

  // Wards
  const wards = [
    { name: 'Ward 1', number: 1, circleCode: 'C01', zoneCode: 'Z01' },
    { name: 'Ward 2', number: 2, circleCode: 'C01', zoneCode: 'Z01' },
    { name: 'Ward 3', number: 3, circleCode: 'C02', zoneCode: 'Z01' },
    { name: 'Ward 10', number: 10, circleCode: 'C03', zoneCode: 'Z02' },
    { name: 'Ward 25', number: 25, circleCode: 'C04', zoneCode: 'Z02' },
    { name: 'Ward 50', number: 50, circleCode: 'C05', zoneCode: 'Z03' },
    { name: 'Ward 57', number: 57, circleCode: 'C05', zoneCode: 'Z03' },
    { name: 'Ward 100', number: 100, circleCode: 'C06', zoneCode: 'Z04' },
  ];

  const wardRecords: Record<string, any> = {};
  for (const ward of wards) {
    const w = await prisma.ward.upsert({
      where: { number_tenantId: { number: ward.number, tenantId: tenant.id } },
      update: {},
      create: {
        name: ward.name,
        number: ward.number,
        circleId: circleRecords[ward.circleCode].id,
        zoneId: zoneRecords[ward.zoneCode].id,
        tenantId: tenant.id,
      },
    });
    wardRecords[ward.number] = w;
  }
  console.log(`Geography: ${zones.length} zones, ${circles.length} circles, ${wards.length} wards`);

  // ======== USERS ========
  const passwordHash = await bcrypt.hash('Password123', 12);

  const users = [
    { email: 'admin@ghmc.gov.in', firstName: 'System', lastName: 'Admin', role: 'SUPER_ADMIN', scopeType: 'GLOBAL' },
    { email: 'commissioner@ghmc.gov.in', firstName: 'Rajesh', lastName: 'Kumar', role: 'COMMISSIONER', scopeType: 'TENANT' },
    { email: 'zonal.z01@ghmc.gov.in', firstName: 'Priya', lastName: 'Sharma', role: 'ZONAL_COMMISSIONER', scopeType: 'ZONE', zoneCode: 'Z01' },
    { email: 'zonal.z03@ghmc.gov.in', firstName: 'Amit', lastName: 'Patel', role: 'ZONAL_COMMISSIONER', scopeType: 'ZONE', zoneCode: 'Z03' },
    { email: 'ward57.officer@ghmc.gov.in', firstName: 'Ravi', lastName: 'Teja', role: 'WARD_OFFICER', scopeType: 'WARD', wardNumber: 57 },
    { email: 'ward1.officer@ghmc.gov.in', firstName: 'Sunitha', lastName: 'Reddy', role: 'WARD_OFFICER', scopeType: 'WARD', wardNumber: 1 },
    { email: 'supervisor1@ghmc.gov.in', firstName: 'Mohan', lastName: 'Rao', role: 'FIELD_SUPERVISOR', scopeType: 'WARD', wardNumber: 57 },
    { email: 'worker1@ghmc.gov.in', firstName: 'Ramesh', lastName: 'Kumar', role: 'FIELD_WORKER', scopeType: 'ASSIGNED_ONLY' },
    { email: 'worker2@ghmc.gov.in', firstName: 'Suresh', lastName: 'Babu', role: 'FIELD_WORKER', scopeType: 'ASSIGNED_ONLY' },
    { email: 'citizen1@example.com', firstName: 'Ananya', lastName: 'Gupta', role: 'CITIZEN', scopeType: 'ASSIGNED_ONLY' },
    { email: 'citizen2@example.com', firstName: 'Vikram', lastName: 'Singh', role: 'CITIZEN', scopeType: 'ASSIGNED_ONLY' },
    { email: 'citizen3@example.com', firstName: 'Lakshmi', lastName: 'Devi', role: 'CITIZEN', scopeType: 'ASSIGNED_ONLY' },
  ];

  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { email_tenantId: { email: userData.email, tenantId: tenant.id } },
      update: {},
      create: {
        email: userData.email,
        passwordHash,
        firstName: userData.firstName,
        lastName: userData.lastName,
        tenantId: tenant.id,
        isActive: true,
        isEmailVerified: true,
      },
    });

    // Assign role
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: roles[userData.role].id } },
      update: {},
      create: { userId: user.id, roleId: roles[userData.role].id },
    });

    // Assign scope
    const scopeData: any = { userId: user.id, scopeType: userData.scopeType };
    if ((userData as any).zoneCode) {
      scopeData.zoneId = zoneRecords[(userData as any).zoneCode].id;
    }
    if ((userData as any).wardNumber) {
      scopeData.wardId = wardRecords[(userData as any).wardNumber].id;
    }

    const existingScope = await prisma.userScope.findFirst({
      where: { userId: user.id },
    });
    if (!existingScope) {
      await prisma.userScope.create({ data: scopeData });
    }
  }
  console.log(`Users: ${users.length} created`);

  // ======== SAMPLE COMPLAINTS ========
  const citizen1 = await prisma.user.findFirst({ where: { email: 'citizen1@example.com', tenantId: tenant.id } });
  const citizen2 = await prisma.user.findFirst({ where: { email: 'citizen2@example.com', tenantId: tenant.id } });
  const wardOfficer = await prisma.user.findFirst({ where: { email: 'ward57.officer@ghmc.gov.in', tenantId: tenant.id } });
  const worker1 = await prisma.user.findFirst({ where: { email: 'worker1@ghmc.gov.in', tenantId: tenant.id } });

  if (citizen1 && citizen2) {
    const sampleComplaints = [
      {
        complaintNumber: 'CMP-2401-00001',
        title: 'Large pothole on main road near bus stop',
        description: 'There is a very large pothole on the main road near bus stop #42 in ward 57. It is causing accidents and traffic jams. Multiple vehicles have been damaged.',
        category: 'POTHOLES',
        priority: 'HIGH',
        status: 'ASSIGNED',
        latitude: 17.385,
        longitude: 78.4867,
        address: 'Main Road, Near Bus Stop #42, Ward 57',
        citizenId: citizen1.id,
        assignedOfficerId: wardOfficer?.id,
        assignedWorkerId: worker1?.id,
        wardId: wardRecords[57]?.id,
        zoneId: zoneRecords['Z03']?.id,
        circleId: circleRecords['C05']?.id,
        departmentId: deptRecords['RB']?.id,
        tenantId: tenant.id,
        slaDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      {
        complaintNumber: 'CMP-2401-00002',
        title: 'Garbage not collected for 3 days',
        description: 'The garbage in our area has not been collected for the past 3 days. It is causing a terrible smell and health concerns for residents. Stray dogs are tearing through the garbage bags.',
        category: 'GARBAGE',
        priority: 'MEDIUM',
        status: 'RECEIVED',
        latitude: 17.4123,
        longitude: 78.4456,
        address: 'Colony Street 5, Ward 57',
        citizenId: citizen2.id,
        wardId: wardRecords[57]?.id,
        zoneId: zoneRecords['Z03']?.id,
        circleId: circleRecords['C05']?.id,
        departmentId: deptRecords['SAN']?.id,
        tenantId: tenant.id,
        slaDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000),
      },
      {
        complaintNumber: 'CMP-2401-00003',
        title: 'Street light not working',
        description: 'The street light at the corner of MG Road and Park Avenue has not been working for over a week. The area is very dark at night and unsafe for pedestrians.',
        category: 'STREET_LIGHTS',
        priority: 'LOW',
        status: 'RESOLVED',
        latitude: 17.3900,
        longitude: 78.4900,
        address: 'Corner of MG Road and Park Avenue, Ward 1',
        citizenId: citizen1.id,
        wardId: wardRecords[1]?.id,
        zoneId: zoneRecords['Z01']?.id,
        circleId: circleRecords['C01']?.id,
        departmentId: deptRecords['SL']?.id,
        tenantId: tenant.id,
        resolution: 'Street light bulb replaced and wiring fixed. Light is now functioning normally.',
        resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        complaintNumber: 'CMP-2401-00004',
        title: 'Water pipeline leaking on residential street',
        description: 'A water pipeline is leaking heavily on our residential street causing water wastage and making the road slippery and muddy. This has been going on for several days.',
        category: 'WATER_LEAKAGE',
        priority: 'CRITICAL',
        status: 'IN_PROGRESS',
        latitude: 17.4300,
        longitude: 78.5100,
        address: 'Residential Block B, Ward 50',
        citizenId: citizen2.id,
        assignedOfficerId: wardOfficer?.id,
        wardId: wardRecords[50]?.id,
        zoneId: zoneRecords['Z03']?.id,
        circleId: circleRecords['C05']?.id,
        departmentId: deptRecords['WS']?.id,
        tenantId: tenant.id,
        slaDeadline: new Date(Date.now() + 4 * 60 * 60 * 1000),
        slaBreached: false,
      },
    ];

    for (const complaint of sampleComplaints) {
      const existing = await prisma.complaint.findUnique({
        where: { complaintNumber: complaint.complaintNumber },
      });
      if (!existing) {
        await prisma.complaint.create({ data: complaint });
      }
    }
    console.log(`Complaints: ${sampleComplaints.length} sample complaints created`);
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
