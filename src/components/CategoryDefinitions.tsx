import React from 'react'
import { Battery, AlertCircle, Heart } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'

interface CategoryDef {
  icon: React.ReactNode
  title: string
  description: string
  bgColor: string
  iconColor: string
  borderColor: string
}

const categories: CategoryDef[] = [
  {
    icon: <Battery className="w-8 h-8" />,
    title: 'Stable',
    description: 'Good energy levels and stress management',
    bgColor: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    borderColor: 'border-emerald-200',
  },
  {
    icon: <AlertCircle className="w-8 h-8" />,
    title: 'Under Pressure',
    description: 'Some signs of strain requiring attention',
    bgColor: 'bg-amber-50',
    iconColor: 'text-amber-600',
    borderColor: 'border-amber-200',
  },
  {
    icon: <Heart className="w-8 h-8" />,
    title: 'Needs Attention',
    description: 'Elevated strain levels indicating need for support',
    bgColor: 'bg-rose-50',
    iconColor: 'text-rose-600',
    borderColor: 'border-rose-200',
  },
]

export function CategoryDefinitions() {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {categories.map((category, index) => (
          <Card
            key={index}
            className={`${category.bgColor} ${category.borderColor} border-2 hover:shadow-lg transition-shadow duration-300`}
          >
            <CardContent className="py-4 px-5">
              <div className="flex flex-col items-center text-center gap-2.5">
                {/* Icon */}
                <div className={`p-2 rounded-lg ${category.bgColor}`}>
                  <div className={category.iconColor}>{category.icon}</div>
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-gray-900">{category.title}</h3>

                {/* Description */}
                <p className="text-xs text-gray-600 leading-relaxed">
                  {category.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
