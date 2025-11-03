'use client'

/**
 * ETraffic Logo Component
 * Circular logo with Oxford Blue and Tan theme
 */
export default function Logo({ size = 48 }: { size?: number }) {
  return (
    <div
      className="relative flex items-center justify-center rounded-full shadow-lg"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        background: 'linear-gradient(135deg, #002147 0%, #003366 100%)',
        border: `3px solid #d2b48c`,
      }}
    >
      <span
        className="font-bold text-white"
        style={{
          fontSize: `${size * 0.35}px`,
          letterSpacing: '0.05em',
        }}
      >
        ET
      </span>
      {/* Decorative circle */}
      <div
        className="absolute top-1 right-1 rounded-full"
        style={{
          width: `${size * 0.2}px`,
          height: `${size * 0.2}px`,
          backgroundColor: '#d2b48c',
          border: `2px solid #002147`,
        }}
      />
    </div>
  )
}

