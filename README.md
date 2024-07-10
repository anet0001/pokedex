# mtm6302-capstone-anet0001

Name: Nonso Anetoh.
Student Number: 041096963.
Project: Pokedex.

Features:

- Search fucntionality that triggers a modal so users can search the api directly and set the active screen on the left to the pokemon from the search result.
- Capture and remove button beside the search button
- Active pokemon information displayed on the left based on the active one on the right screens

Resources / Tool Uses:

- Pokemon Images are from a Figma Plugin (Figma Pokemon)
- Frames were made using both Photoshop and Illustrator

Challenges Faced:

- Design Direction - The current frame looks very realistic so I would have to make frames for everything so that it all has the same look and feel
- Scaling for something like this is always going to be an issue so I had to make sure that things scaled down and up accordingly. A fix for this was reducing the font size to a very small value based on the largest breakpoint I had in my design (1920px) and then using rem values through out my CSS so that everything matches no matter the screen size. I can then multiply that fontsize value on any breakpoint where things got too small.

Whats Left:

- Cleaning up the design (The inner screens are still very rough because they dont match the realism and frame style)
- Implement Focus Functionality (I already know how to go about this, it just requires javascript so all the triggers and elements are going to be on my part-4)
- Button states based on current user action (mouse-down and so on)
- A few of the frames still need to be reworked. Especially on mobile, everything is on a single column so I need to swap out some of the frames to look like its one device.
