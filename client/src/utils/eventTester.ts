// File: client/src/utils/eventTester.ts
import { AdminEvents, emitAdminEvent } from './adminUser';

/**
 * Utility to test the event system in isolation.
 * This helps identify if the problem is with event emission or event handling.
 */

// Tracks event listeners that were registered with this utility
const registeredListeners: { 
  target: EventTarget, 
  type: string, 
  listener: EventListener,
  options?: AddEventListenerOptions | boolean
}[] = [];

/**
 * Test if events are being detected by registering a test listener
 */
export function setupEventListener() {
  console.log("📡 Setting up test event listeners...");
  
  // Define our test handler
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent;
    console.log("🔔 EVENT RECEIVED:", {
      type: customEvent.type,
      detail: customEvent.detail,
      target: event.target,
      timestamp: new Date().toISOString()
    });
  };
  
  // Register it on both document and window to catch all events
  document.addEventListener('adminAction', handler);
  window.addEventListener('adminAction', handler);
  
  // Save references so we can clean up later
  registeredListeners.push(
    { target: document, type: 'adminAction', listener: handler },
    { target: window, type: 'adminAction', listener: handler }
  );
  
  console.log("✅ Test event listeners installed successfully");
  return "Event listeners installed. Try emitting an event with emitTestEvent().";
}

/**
 * Emit a test event to see if listeners pick it up
 */
export function emitTestEvent(eventType = AdminEvents.USER_CREATED) {
  console.log(`🔔 Attempting to emit test event: ${eventType}`);
  
  try {
    // Use the actual emit function from adminUser
    const result = emitAdminEvent(eventType);
    console.log(`✅ Event emission result: ${result ? 'Success' : 'Failed'}`);
    
    // Also try a direct event dispatch as a fallback
    console.log("🔔 Also trying direct event dispatch...");
    
    const directEvent = new CustomEvent('adminAction', {
      detail: {
        type: eventType,
        timestamp: new Date().toISOString(),
        test: true
      },
      bubbles: true,
      cancelable: false
    });
    
    // Dispatch on both targets
    document.dispatchEvent(directEvent);
    window.dispatchEvent(directEvent);
    
    console.log("✅ Direct event dispatch completed");
    
    return `Test event '${eventType}' emitted. Check the console for listener responses.`;
  } catch (error) {
    console.error("❌ Error emitting test event:", error);
    return `Error emitting test event: ${error instanceof Error ? error.message : String(error)}`;
  }
}

/**
 * Clean up event listeners when done testing
 */
export function cleanupEventListeners() {
  console.log("🧹 Cleaning up test event listeners...");
  
  registeredListeners.forEach(({ target, type, listener, options }) => {
    target.removeEventListener(type, listener, options);
  });
  
  // Clear the array
  registeredListeners.length = 0;
  
  console.log("✅ Event listeners removed");
  return "All test event listeners have been removed.";
}

/**
 * Make this module available in the browser console:
 * 
 * 1. import('/src/utils/eventTester.js').then(m => window.eventTester = m);
 * 2. window.eventTester.setupEventListener();
 * 3. window.eventTester.emitTestEvent();
 * 4. window.eventTester.cleanupEventListeners();
 */

// Declare types for window extension
declare global {
  interface Window {
    eventTester: {
      setupEventListener: typeof setupEventListener;
      emitTestEvent: typeof emitTestEvent;
      cleanupEventListeners: typeof cleanupEventListeners;
      eventTypes: typeof AdminEvents;
    }
  }
}

// Add to window for console access if in browser environment
if (typeof window !== 'undefined') {
  window.eventTester = {
    setupEventListener,
    emitTestEvent,
    cleanupEventListeners,
    eventTypes: AdminEvents
  };
}