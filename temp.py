import cv2
import time

def preview_webcam(duration=10):
    # Initialize webcam
    cap = cv2.VideoCapture(0)  # Try 0, 1, 2 if needed
    
    if not cap.isOpened():
        print("Error: Could not open webcam.")
        return
        
    print("Webcam opened successfully!")
    
    # Get the start time
    start_time = time.time()
    
    # Keep camera open for specified duration
    while (time.time() - start_time) < duration:
        # Capture frame-by-frame
        ret, frame = cap.read()
        
        if ret:
            # Display the frame
            cv2.imshow('Webcam Preview', frame)
            
            # Break loop if 'q' is pressed
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
        else:
            print("Error: Couldn't read frame.")
            break
    
    # Clean up
    cap.release()
    cv2.destroyAllWindows()
    print(f"Preview ended after {duration} seconds.")

# Run the preview
preview_webcam(10)