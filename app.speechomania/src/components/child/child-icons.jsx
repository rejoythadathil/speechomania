import { ART } from './art.jsx'

function openmoji(name) {
  return function Icon({ size = 24, className }) {
    return (
      <img
        className={className}
        src={ART[name]}
        width={size}
        height={size}
        alt=""
        draggable="false"
      />
    )
  }
}

export const GrownUpIcon = openmoji('locked')

export const SayAgainIcon = openmoji('sound-on')

export const MuteIcon = openmoji('sound-off')

export const BreakIcon = openmoji('pause')

export const NextIcon = openmoji('arrow-right')

export const BackIcon = openmoji('arrow-left')
