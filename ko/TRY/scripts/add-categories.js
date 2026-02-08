const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function addCategories() {
    console.log('Adding manufacturing categories...')

    const categories = [
        {
            id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', // Additive
            name: 'Additive',
            slug: 'additive',
            description: 'Additive manufacturing courses including 3D printing and related technologies'
        },
        {
            id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', // Electronic
            name: 'Electronic',
            slug: 'electronic',
            description: 'Electronic manufacturing courses covering circuit design, PCB assembly, and electronics'
        },
        {
            id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', // Subtractive',
            name: 'Subtractive',
            slug: 'subtractive',
            description: 'Subtractive manufacturing courses including CNC machining, milling, and cutting'
        }
    ]

    for (const category of categories) {
        const { data, error } = await supabase
            .from('categories')
            .upsert(category, { onConflict: 'name' })
            .select()

        if (error) {
            console.error(`❌ Error adding ${category.name}:`, error.message)
        } else {
            console.log(`✅ Added category: ${category.name}`)
        }
    }

    // Verify all categories
    const { data: allCategories } = await supabase
        .from('categories')
        .select('*')
        .order('name')

    console.log('\n📋 All categories:')
    console.table(allCategories)
}

addCategories()
    .then(() => {
        console.log('\n✅ Categories setup complete!')
        process.exit(0)
    })
    .catch((error) => {
        console.error('❌ Error:', error)
        process.exit(1)
    })
