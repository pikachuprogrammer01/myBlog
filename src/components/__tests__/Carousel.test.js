import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Carousel from '../common/Carousel.vue'

describe('Carousel.vue', () => {
  const defaultSlides = [
    { image: '/images/carousel1.jpg', title: 'Slide 1', description: 'Description 1' },
    { image: '/images/carousel2.jpg', title: 'Slide 2', description: 'Description 2' },
    { image: '/images/carousel3.jpg', title: 'Slide 3', description: 'Description 3' }
  ]

  it('渲染正确的幻灯片数量', () => {
    const wrapper = mount(Carousel, {
      props: {
        slides: defaultSlides
      }
    })

    // 检查幻灯片数量
    const slides = wrapper.findAll('.carousel-slide')
    expect(slides).toHaveLength(3)
  })

  it('默认显示第一张幻灯片', () => {
    const wrapper = mount(Carousel, {
      props: {
        slides: defaultSlides
      }
    })

    // 检查第一张幻灯片有active类
    const firstSlide = wrapper.find('.carousel-slide')
    expect(firstSlide.classes()).toContain('active')
  })

  it('渲染幻灯片标题和描述', () => {
    const wrapper = mount(Carousel, {
      props: {
        slides: defaultSlides
      }
    })

    // 检查第一张幻灯片的标题
    const title = wrapper.find('.slide-title')
    expect(title.text()).toBe('Slide 1')

    // 检查第一张幻灯片的描述
    const description = wrapper.find('.slide-description')
    expect(description.text()).toBe('Description 1')
  })

  it('当slides为空时不渲染内容', () => {
    const wrapper = mount(Carousel, {
      props: {
        slides: []
      }
    })

    const slides = wrapper.findAll('.carousel-slide')
    expect(slides).toHaveLength(0)
  })
})