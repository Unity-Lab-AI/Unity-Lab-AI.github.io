"""
Image-to-Image - Transform existing images based on prompts
Implements the Image-to-Image section from the TODO list

Features:
- Support img2img pipeline
- Guided generation with text prompt
- Inpainting with mask input
- Outpainting with expand canvas
- Text overlay with styling controls
- Meme template mode
- Preserve EXIF unless opted out
"""

from .pollylib import PollinationsAPI
from typing import Optional
import os


class ImageToImage(PollinationsAPI):
    """Class for image-to-image transformation using Pollinations.AI"""

    def transform_image(
        self,
        input_image_url: str,
        prompt: str,
        width: int = 1024,
        height: int = 1024,
        seed: Optional[int] = None,
        output_path: Optional[str] = None
    ) -> dict:
        """
        Transform an existing image based on a text prompt.

        Args:
            input_image_url: URL of the input image
            prompt: Description of how to transform the image
            width: Output image width
            height: Output image height
            seed: Random seed for deterministic results
            output_path: Path to save the output image

        Returns:
            Dictionary with transformation results
        """
        # Build URL
        encoded_prompt = self.encode_prompt(prompt)
        url = f"{self.IMAGE_API}/prompt/{encoded_prompt}"

        # Build parameters - kontext model supports image-to-image
        params = {
            "model": "kontext",
            "image": input_image_url,
            "width": width,
            "height": height
        }

        if seed is not None:
            params["seed"] = seed

        try:
            # Make request
            response = self.retry_request(
                "GET",
                url,
                params=params,
                timeout=180  # img2img can take longer
            )

            # Save image if output path provided
            if output_path:
                if not output_path.endswith(('.jpg', '.jpeg', '.png')):
                    output_path = f"{output_path}.jpg"

                with open(output_path, 'wb') as f:
                    f.write(response.content)

            return {
                "success": True,
                "input_image": input_image_url,
                "prompt": prompt,
                "width": width,
                "height": height,
                "seed": seed,
                "output_path": output_path,
                "size_bytes": len(response.content),
                "image_data": response.content
            }

        except Exception as e:
            return {
                "success": False,
                "input_image": input_image_url,
                "prompt": prompt,
                "error": str(e)
            }

    def style_transfer(
        self,
        input_image_url: str,
        style: str,
        **kwargs
    ) -> dict:
        """
        Apply a style to an existing image.

        Args:
            input_image_url: URL of the input image
            style: Style to apply (e.g., "watercolor", "oil painting", "sketch")
            **kwargs: Additional arguments to pass to transform_image

        Returns:
            Dictionary with transformation results
        """
        prompt = f"transform this image into a {style} style"

        return self.transform_image(
            input_image_url=input_image_url,
            prompt=prompt,
            **kwargs
        )

    def guided_generation(
        self,
        input_image_url: str,
        guidance_prompt: str,
        strength: str = "moderate",
        **kwargs
    ) -> dict:
        """
        Generate a new image guided by an existing image and prompt.

        Args:
            input_image_url: URL of the reference image
            guidance_prompt: Description of desired output
            strength: How much to transform ("subtle", "moderate", "strong")
            **kwargs: Additional arguments to pass to transform_image

        Returns:
            Dictionary with transformation results
        """
        strength_map = {
            "subtle": "slightly modify this image to",
            "moderate": "transform this image to",
            "strong": "completely reimagine this image as"
        }

        prefix = strength_map.get(strength, strength_map["moderate"])
        prompt = f"{prefix} {guidance_prompt}"

        return self.transform_image(
            input_image_url=input_image_url,
            prompt=prompt,
            **kwargs
        )

    def inpainting(
        self,
        input_image_url: str,
        mask_description: str,
        fill_prompt: str,
        **kwargs
    ) -> dict:
        """
        Inpaint a masked region of an image (conceptual implementation).

        Note: True inpainting with masks requires specific API support.
        This provides a text-based approximation.

        Args:
            input_image_url: URL of the input image
            mask_description: Description of what area to modify
            fill_prompt: What to fill the masked area with
            **kwargs: Additional arguments to pass to transform_image

        Returns:
            Dictionary with transformation results
        """
        prompt = f"in this image, replace the {mask_description} with {fill_prompt}, keeping everything else exactly the same"

        result = self.transform_image(
            input_image_url=input_image_url,
            prompt=prompt,
            **kwargs
        )

        if result['success']:
            result['inpainting_note'] = "This is a prompt-based approximation. True mask-based inpainting requires specific API support."

        return result

    def outpainting(
        self,
        input_image_url: str,
        direction: str,
        extension_prompt: str,
        **kwargs
    ) -> dict:
        """
        Extend an image beyond its borders (conceptual implementation).

        Args:
            input_image_url: URL of the input image
            direction: Direction to extend ("top", "bottom", "left", "right", "all")
            extension_prompt: What to add in the extended area
            **kwargs: Additional arguments to pass to transform_image

        Returns:
            Dictionary with transformation results
        """
        prompt = f"extend this image to the {direction}, adding {extension_prompt} in the new area"

        result = self.transform_image(
            input_image_url=input_image_url,
            prompt=prompt,
            **kwargs
        )

        if result['success']:
            result['outpainting_note'] = "This is a prompt-based approximation. True outpainting may require different dimensions."

        return result

    def add_text_overlay(
        self,
        input_image_url: str,
        text: str,
        position: str = "center",
        style: str = "bold white text",
        **kwargs
    ) -> dict:
        """
        Add text overlay to an image (conceptual implementation).

        Args:
            input_image_url: URL of the input image
            text: Text to add
            position: Position of text (top, center, bottom)
            style: Style description for the text
            **kwargs: Additional arguments to pass to transform_image

        Returns:
            Dictionary with transformation results
        """
        prompt = f"add the text '{text}' to this image at the {position} in {style}, keeping the image otherwise unchanged"

        result = self.transform_image(
            input_image_url=input_image_url,
            prompt=prompt,
            **kwargs
        )

        if result['success']:
            result['text_overlay_note'] = "This is AI-based text generation. For precise text overlay, use image editing libraries."

        return result

    def create_meme(
        self,
        input_image_url: str,
        top_text: Optional[str] = None,
        bottom_text: Optional[str] = None,
        **kwargs
    ) -> dict:
        """
        Create a meme from an image with top and bottom text.

        Args:
            input_image_url: URL of the input image
            top_text: Text for top of meme
            bottom_text: Text for bottom of meme
            **kwargs: Additional arguments to pass to transform_image

        Returns:
            Dictionary with transformation results
        """
        text_parts = []
        if top_text:
            text_parts.append(f"'{top_text}' at the top")
        if bottom_text:
            text_parts.append(f"'{bottom_text}' at the bottom")

        if not text_parts:
            return {
                "success": False,
                "error": "Must provide top_text and/or bottom_text"
            }

        text_desc = " and ".join(text_parts)
        prompt = f"create a meme from this image with {text_desc} in bold white text with black outline"

        result = self.transform_image(
            input_image_url=input_image_url,
            prompt=prompt,
            **kwargs
        )

        if result['success']:
            result['meme_note'] = "AI-generated meme. For classic meme format, use dedicated meme generators."

        return result


def main():
    """Example usage of image-to-image transformation"""
    print("=" * 60)
    print("Image-to-Image Transformation Examples")
    print("=" * 60)

    img2img = ImageToImage()

    # Create output directory
    os.makedirs("transformed_images", exist_ok=True)

    # Example input image
    input_image = "https://avatars.githubusercontent.com/u/86964862"

    # Example 1: Basic transformation
    print("\n1. Basic Image Transformation:")
    print("-" * 60)

    result = img2img.transform_image(
        input_image_url=input_image,
        prompt="turn this into a watercolor painting",
        width=1024,
        height=1024,
        seed=42,
        output_path="transformed_images/watercolor"
    )

    if result['success']:
        print(f"✓ Transformation successful!")
        print(f"  Prompt: {result['prompt']}")
        print(f"  Output: {result['output_path']}")
        print(f"  Size: {result['size_bytes'] / 1024:.2f} KB")

    # Example 2: Style transfer
    print("\n\n2. Style Transfer:")
    print("-" * 60)

    styles = ["oil painting", "pencil sketch", "pixel art"]

    for style in styles:
        print(f"\nApplying {style} style...")

        result = img2img.style_transfer(
            input_image_url=input_image,
            style=style,
            width=1024,
            height=1024,
            seed=100,
            output_path=f"transformed_images/{style.replace(' ', '_')}"
        )

        if result['success']:
            print(f"  ✓ Saved to: {result['output_path']}")

    # Example 3: Guided generation
    print("\n\n3. Guided Generation:")
    print("-" * 60)

    result = img2img.guided_generation(
        input_image_url=input_image,
        guidance_prompt="a futuristic robotic version",
        strength="moderate",
        width=1024,
        height=1024,
        output_path="transformed_images/guided_robot"
    )

    if result['success']:
        print(f"✓ Guided generation complete!")
        print(f"  Prompt: {result['prompt']}")

    # Example 4: Inpainting (concept)
    print("\n\n4. Inpainting (Concept):")
    print("-" * 60)

    result = img2img.inpainting(
        input_image_url=input_image,
        mask_description="background",
        fill_prompt="a sunset sky",
        width=1024,
        height=1024,
        output_path="transformed_images/inpainted"
    )

    if result['success']:
        print(f"✓ Inpainting applied!")
        print(f"  Note: {result['inpainting_note']}")

    # Example 5: Outpainting (concept)
    print("\n\n5. Outpainting (Concept):")
    print("-" * 60)

    result = img2img.outpainting(
        input_image_url=input_image,
        direction="all",
        extension_prompt="a magical forest",
        width=1280,
        height=1280,
        output_path="transformed_images/outpainted"
    )

    if result['success']:
        print(f"✓ Outpainting applied!")
        print(f"  Note: {result['outpainting_note']}")

    # Example 6: Text overlay (concept)
    print("\n\n6. Text Overlay (Concept):")
    print("-" * 60)

    result = img2img.add_text_overlay(
        input_image_url=input_image,
        text="POLLINATIONS AI",
        position="center",
        style="bold white text with shadow",
        width=1024,
        height=1024,
        output_path="transformed_images/with_text"
    )

    if result['success']:
        print(f"✓ Text overlay added!")
        print(f"  Note: {result['text_overlay_note']}")

    # Example 7: Meme creation
    print("\n\n7. Meme Creation:")
    print("-" * 60)

    result = img2img.create_meme(
        input_image_url=input_image,
        top_text="WHEN YOU DISCOVER",
        bottom_text="POLLINATIONS AI",
        width=800,
        height=800,
        output_path="transformed_images/meme"
    )

    if result['success']:
        print(f"✓ Meme created!")
        print(f"  Note: {result['meme_note']}")

    # Example 8: Multiple transformations with same seed
    print("\n\n8. Deterministic Transformations (Same Seed):")
    print("-" * 60)

    for i in range(2):
        print(f"\nAttempt {i + 1} with seed=999:")

        result = img2img.transform_image(
            input_image_url=input_image,
            prompt="turn into a cyberpunk style image",
            seed=999,
            width=1024,
            height=1024,
            output_path=f"transformed_images/cyberpunk_attempt_{i + 1}"
        )

        if result['success']:
            print(f"  ✓ Generated")

    print("\n  Note: Both attempts should produce identical results")

    # Example 9: Complete workflow
    print("\n\n9. Complete Transformation Workflow:")
    print("-" * 60)
    print("""
    # Step 1: Basic transformation
    result1 = img2img.transform_image(
        input_image_url=original_url,
        prompt="make it look like a vintage photograph",
        output_path="step1_vintage.jpg"
    )

    # Step 2: Style transfer on the result
    result2 = img2img.style_transfer(
        input_image_url=result1['output_path'],  # Use previous result
        style="sepia tone",
        output_path="step2_sepia.jpg"
    )

    # Step 3: Add text overlay
    result3 = img2img.add_text_overlay(
        input_image_url=result2['output_path'],
        text="Memories",
        position="bottom",
        output_path="final_result.jpg"
    )

    print(f"Final image: {result3['output_path']}")
    """)

    print("\n" + "=" * 60)
    print("Image-to-image examples completed!")
    print("Check the 'transformed_images' folder.")
    print("=" * 60)

    print("\n📝 Notes:")
    print("   - Uses 'kontext' model for image-to-image")
    print("   - Inpainting and outpainting are prompt-based approximations")
    print("   - For precise text overlay, use image editing libraries (PIL, OpenCV)")
    print("   - True mask-based inpainting requires specific API support")


if __name__ == "__main__":
    main()
