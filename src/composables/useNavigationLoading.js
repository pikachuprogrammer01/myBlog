import { ref } from 'vue';

const isNavigating = ref(false);

export function useNavigationLoading() {
  function startNavigation() {
    isNavigating.value = true;
  }

  function endNavigation() {
    isNavigating.value = false;
  }

  return {
    isNavigating,
    startNavigation,
    endNavigation,
  };
}
