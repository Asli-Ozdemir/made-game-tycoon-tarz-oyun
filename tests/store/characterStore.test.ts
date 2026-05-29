import { describe, it, expect, beforeEach } from 'vitest'
import { useCharacterStore } from '@/store/characterStore'
import { BACKGROUNDS } from '@/data/backgrounds'

const DEFAULT_PERSONALITY = { karisma: 0, odak: 0, rekabetcilik: 0, yaraticilik: 0, isZekasi: 0 }

beforeEach(() => {
  useCharacterStore.setState({
    isCreated: false,
    name: '',
    studioName: '',
    background: null,
    profession: { programlama: 0, tasarim: 0, ses: 0, projeyonetimi: 0 },
    personality: DEFAULT_PERSONALITY,
  })
})

describe('characterStore', () => {
  it('başlangıçta isCreated false', () => {
    expect(useCharacterStore.getState().isCreated).toBe(false)
  })

  it('setBackground arkaplan stat\'larını ayarlar', () => {
    useCharacterStore.getState().setBackground('bas_muhendis')
    const s = useCharacterStore.getState()
    expect(s.background).toBe('bas_muhendis')
    expect(s.profession.programlama).toBe(8)
    expect(s.profession.tasarim).toBe(3)
  })

  it('setPersonality kişilik stat\'larını ayarlar', () => {
    const stats = { karisma: 2, odak: 1, rekabetcilik: 1, yaraticilik: 1, isZekasi: 0 }
    useCharacterStore.getState().setPersonality(stats)
    expect(useCharacterStore.getState().personality).toEqual(stats)
  })

  it('setIdentity isim ve stüdyo adını ayarlar', () => {
    useCharacterStore.getState().setIdentity('Aslı', 'Pixel Dreams')
    const s = useCharacterStore.getState()
    expect(s.name).toBe('Aslı')
    expect(s.studioName).toBe('Pixel Dreams')
  })

  it('reset tüm state\'i temizler', () => {
    useCharacterStore.getState().setBackground('bas_muhendis')
    useCharacterStore.getState().reset()
    const s = useCharacterStore.getState()
    expect(s.isCreated).toBe(false)
    expect(s.background).toBeNull()
    expect(s.name).toBe('')
  })

  it('getPlayerSkillBonus meslek stat ortalamasını döner', () => {
    useCharacterStore.getState().setBackground('bas_muhendis')
    // (8+3+2+4)/4 * 0.3 = 17/4 * 0.3 = 4.25 * 0.3 = 1.275
    const bonus = useCharacterStore.getState().getPlayerSkillBonus()
    expect(bonus).toBeCloseTo(1.275, 2)
  })
})
