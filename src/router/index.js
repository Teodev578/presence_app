import { ref, computed } from 'vue'

const getCleanHash = () => {
  const hash = window.location.hash.slice(1)
  if (!hash || hash === '') return '/'
  return hash.startsWith('/') ? hash : `/${hash}`
}

const currentPath = ref(getCleanHash())

window.addEventListener('hashchange', () => {
  currentPath.value = getCleanHash()
})

export function useRouter() {
  const navigate = (path) => {
    const target = path.startsWith('/') ? path : `/${path}`
    if (window.location.hash !== `#${target}`) {
      window.location.hash = target
    }
  }

  const route = computed(() => {
    const [pathOnly, queryString] = currentPath.value.split('?')
    const params = new URLSearchParams(queryString || '')
    return {
      path: pathOnly,
      query: Object.fromEntries(params.entries()),
      fullPath: currentPath.value,
    }
  })

  return {
    route,
    currentPath,
    navigate,
  }
}
