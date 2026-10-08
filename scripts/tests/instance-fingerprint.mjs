import assert from 'node:assert/strict'
import { computeInstanceFingerprint, reconcileQuarantinedMutation } from '../../src/lib/domain.js'

console.log('--- Test de l’empreinte d’instance distante et de la réconciliation de quarantaine ---')

// 1. Calcul déterministe de l'empreinte d'instance
const fp1 = computeInstanceFingerprint({
  supabaseUrl: 'https://pvquzkpfdjrequbwnhur.supabase.co',
  genesisTimestamp: '2026-10-02T19:00:00.000Z',
})
assert.equal(fp1, 'pvquzkpfdjrequbwnhur.supabase.co#2026-10-02T19:00:00.000Z')

// 2. Détection de divergence si l'URL ou la genèse change
const fpDifferentGenesis = computeInstanceFingerprint({
  supabaseUrl: 'https://pvquzkpfdjrequbwnhur.supabase.co',
  genesisTimestamp: '2026-10-08T11:35:19.000Z',
})
assert.notEqual(fp1, fpDifferentGenesis)

const fpDifferentHost = computeInstanceFingerprint({
  supabaseUrl: 'https://otherproject123.supabase.co',
  genesisTimestamp: '2026-10-02T19:00:00.000Z',
})
assert.notEqual(fp1, fpDifferentHost)

// 3. Repli si paramètres incomplets
const fpFallback = computeInstanceFingerprint({})
assert.equal(fpFallback, 'localhost#default')

// 4. Réconciliation d'une mutation de présence en quarantaine
const oldUserId = '018f4a2b-8a50-7000-8000-000000000001'
const newUserId = '018f4a2b-8a50-7000-8000-000000000099'

const presenceMutation = {
  id: '018f4a2b-8a50-7000-8000-000000000010',
  client_mutation_id: '018f4a2b-8a50-7000-8000-000000000020',
  table_name: 'presences',
  operation: 'INSERT',
  payload: {
    id: '018f4a2b-8a50-7000-8000-000000000030',
    user_id: oldUserId,
    work_date: '2026-10-08',
    check_in_time: '2026-10-08T08:32:00.000Z',
    status: 'present',
  },
}

const reconcileResult = reconcileQuarantinedMutation(presenceMutation, newUserId)
assert.equal(reconcileResult.canReconcile, true)
assert.equal(reconcileResult.status, 'reconciled')
assert.equal(reconcileResult.updatedPayload.user_id, newUserId)
assert.equal(reconcileResult.updatedPayload.check_in_time, '2026-10-08T08:32:00.000Z')

// 5. Cas d'une mutation non réconciliable (cible inexistante ou table système)
const orphanResult = reconcileQuarantinedMutation(presenceMutation, null)
assert.equal(orphanResult.canReconcile, false)
assert.equal(orphanResult.status, 'orphaned')

console.log('✓ Tous les tests d’empreinte d’instance et de réconciliation sont validés.')
