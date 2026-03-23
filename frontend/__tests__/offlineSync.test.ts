import { OfflineSyncManager } from '../src/utils/offlineSync'

describe('OfflineSyncManager', () => {
  let manager: OfflineSyncManager

  beforeEach(() => {
    localStorage.clear()
    manager = new OfflineSyncManager()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('addRequest', () => {
    it('should add a request to the queue', () => {
      const id = manager.addRequest('POST', '/api/users', { name: 'John' })

      expect(id).toBeDefined()
      expect(manager.getQueueSize()).toBe(1)
    })

    it('should persist queue to localStorage', () => {
      manager.addRequest('POST', '/api/users', { name: 'John' })

      const stored = localStorage.getItem('erp_request_queue')
      expect(stored).toBeDefined()
      expect(JSON.parse(stored!).length).toBe(1)
    })

    it('should support different HTTP methods', () => {
      manager.addRequest('GET', '/api/users')
      manager.addRequest('POST', '/api/users', {})
      manager.addRequest('PUT', '/api/users/1', {})
      manager.addRequest('DELETE', '/api/users/1')
      manager.addRequest('PATCH', '/api/users/1', {})

      expect(manager.getQueueSize()).toBe(5)
    })
  })

  describe('removeRequest', () => {
    it('should remove a request from the queue', () => {
      const id = manager.addRequest('POST', '/api/users', { name: 'John' })
      expect(manager.getQueueSize()).toBe(1)

      manager.removeRequest(id)
      expect(manager.getQueueSize()).toBe(0)
    })

    it('should persist removal to localStorage', () => {
      const id = manager.addRequest('POST', '/api/users', { name: 'John' })
      manager.removeRequest(id)

      const stored = localStorage.getItem('erp_request_queue')
      const requests = stored ? JSON.parse(stored) : []
      expect(requests.length).toBe(0)
    })
  })

  describe('getQueue', () => {
    it('should return all queued requests', () => {
      manager.addRequest('POST', '/api/users', { name: 'John' })
      manager.addRequest('POST', '/api/clients', { name: 'Acme' })

      const queue = manager.getQueue()
      expect(queue.length).toBe(2)
      expect(queue[0].method).toBe('POST')
      expect(queue[1].method).toBe('POST')
    })

    it('should include metadata for each request', () => {
      manager.addRequest('POST', '/api/users', { name: 'John' })
      const queue = manager.getQueue()

      expect(queue[0]).toHaveProperty('id')
      expect(queue[0]).toHaveProperty('method')
      expect(queue[0]).toHaveProperty('url')
      expect(queue[0]).toHaveProperty('body')
      expect(queue[0]).toHaveProperty('timestamp')
      expect(queue[0]).toHaveProperty('retries')
    })
  })

  describe('clearQueue', () => {
    it('should clear all requests', () => {
      manager.addRequest('POST', '/api/users', { name: 'John' })
      manager.addRequest('POST', '/api/clients', { name: 'Acme' })
      expect(manager.getQueueSize()).toBe(2)

      manager.clearQueue()
      expect(manager.getQueueSize()).toBe(0)
    })

    it('should clear localStorage', () => {
      manager.addRequest('POST', '/api/users', { name: 'John' })
      manager.clearQueue()

      const stored = localStorage.getItem('erp_request_queue')
      const requests = stored ? JSON.parse(stored) : []
      expect(requests.length).toBe(0)
    })
  })

  describe('Queue persistence', () => {
    it('should load queue from localStorage on init', () => {
      manager.addRequest('POST', '/api/users', { name: 'John' })
      expect(manager.getQueueSize()).toBe(1)

      // Create new manager instance
      const newManager = new OfflineSyncManager()
      expect(newManager.getQueueSize()).toBe(1)
    })

    it('should handle corrupted localStorage data', () => {
      localStorage.setItem('erp_request_queue', 'invalid json')

      // Should not throw
      expect(() => {
        new OfflineSyncManager()
      }).not.toThrow()
    })
  })

  describe('Request retry logic', () => {
    it('should track retry count', () => {
      const id = manager.addRequest('POST', '/api/users', { name: 'John' })
      const request = manager.getQueue()[0]

      expect(request.retries).toBe(0)
    })

    it('should include request metadata', () => {
      const body = { name: 'John', email: 'john@example.com' }
      manager.addRequest('POST', '/api/users', body)

      const request = manager.getQueue()[0]
      expect(request.url).toBe('/api/users')
      expect(request.body).toEqual(body)
      expect(request.method).toBe('POST')
    })
  })

  describe('getQueueSize', () => {
    it('should return correct queue size', () => {
      expect(manager.getQueueSize()).toBe(0)

      manager.addRequest('POST', '/api/users', {})
      expect(manager.getQueueSize()).toBe(1)

      manager.addRequest('POST', '/api/clients', {})
      expect(manager.getQueueSize()).toBe(2)

      const firstId = manager.getQueue()[0].id
      manager.removeRequest(firstId)
      expect(manager.getQueueSize()).toBe(1)
    })
  })
})
