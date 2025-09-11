import { prisma } from './db';
import bcrypt from 'bcrypt';

async function main() {
    //admin user
    const email = 'admin@demo.com';
    const pass = await bcrypt.hash('admin123', 10);
    await prisma.user.upsert({
        where: { email },
        update: {},
        create: { email, password: pass, role: 'admin' }
    });

    //tenant
    const tenant = await prisma.tenant.upsert({
        where: { name: 'DemoCompany'},
        update: {},
        create: { name: 'DemoCompany' }
    });

    //project
    const project = await prisma.project.create({
        data: { name: 'Shop', tenantId: tenant.id }
    });

    //env
    const dev = await prisma.environment.create({
        data: { 
            name: 'dev', 
            projectId: project.id,
            settings: { download_link_ttl_hours: 24 } as any,
            sdkKey: crypto.randomUUID() 
        }
    });
    const prod = await prisma.environment.create({
        data: { 
            name: 'prod', 
            projectId: project.id,
            settings: { download_link_ttl_hours: 24 } as any,
            sdkKey: crypto.randomUUID() 
        }
    });

    //segment proUS in prod
    const proUS = await prisma.segment.create({
        data: {
            envId: prod.id,
            name: 'proUS',
            conditions: [
                { attr: 'country', op: 'eq', values: ['US'] },
                { attr: 'plan', op: 'eq', values: ['pro'] }
            ] as any
        }
    });

    //flag newCheckout in prod
    const flag = await prisma.flag.create({
        data: {
        envId: prod.id,
        key: 'newCheckout',
        description: 'Roll out new checkout flow',
        enabled: true,
        rollout: 25
        }
    });

    await prisma.rule.create({
        data: {
        flagId: flag.id,
        priority: 1,
        segmentName: proUS.name,
        variantPercent: { on: 50, off: 50 } as any
        }
    });

    console.log('Seed complete');
}


main().finally(() => prisma.$disconnect());
