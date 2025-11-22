"""
Text-to-Image Generation - Generate images from text prompts
Implements the Text-to-Image Generation section from the TODO list

Features:
- Generate images across all supported models
- Provide N variants with same prompt
- Add seed support for determinism
- Apply safety filters on prompts
- Report blocked content clearly
- Support image size selection
- Support PNG and JPEG export
- Expose inference time in logs
"""

from .pollylib import PollinationsAPI
from typing import Optional, List
import time
import os


class TextToImage(PollinationsAPI):
    """Class for text-to-image generation using Pollinations.AI"""

    def generate_image(
        self,
        prompt: str,
        model: str = "flux",
        width: int = 1024,
        height: int = 1024,
        seed: Optional[int] = None,
        nologo: bool = False,
        enhance: bool = False,
        private: bool = False,
        safe: bool = False,
        output_path: Optional[str] = None
    ) -> dict:
        """
        Generate a single image from a text prompt.

        Args:
            prompt: Description of the image to generate
            model: AI model to use (flux, turbo, etc.)
            width: Image width in pixels
            height: Image height in pixels
            seed: Random seed for deterministic generation
            nologo: Remove Pollinations watermark (requires account)
            enhance: Let AI improve the prompt automatically
            private: Hide image from public feeds
            safe: Enable strict NSFW filtering
            output_path: Path to save the image (optional)

        Returns:
            Dictionary with image data and metadata
        """
        start_time = time.time()

        # Build URL
        encoded_prompt = self.encode_prompt(prompt)
        url = f"{self.IMAGE_API}/prompt/{encoded_prompt}"

        # Build parameters
        params = {
            "model": model,
            "width": width,
            "height": height
        }

        if seed is not None:
            params["seed"] = seed
        if nologo:
            params["nologo"] = "true"
        if enhance:
            params["enhance"] = "true"
        if private:
            params["private"] = "true"
        if safe:
            params["safe"] = "true"

        try:
            # Make request
            response = self.retry_request(
                "GET",
                url,
                params=params,
                timeout=120
            )

            # Calculate inference time
            inference_time = time.time() - start_time

            # Get content type to determine format
            content_type = response.headers.get('Content-Type', '')
            is_png = 'png' in content_type
            file_extension = 'png' if is_png else 'jpg'

            # Save image if output path provided
            if output_path:
                # Add extension if not present
                if not output_path.endswith(('.jpg', '.jpeg', '.png')):
                    output_path = f"{output_path}.{file_extension}"

                with open(output_path, 'wb') as f:
                    f.write(response.content)

            return {
                "success": True,
                "prompt": prompt,
                "model": model,
                "width": width,
                "height": height,
                "seed": seed,
                "image_data": response.content,
                "content_type": content_type,
                "format": file_extension,
                "inference_time": inference_time,
                "output_path": output_path,
                "size_bytes": len(response.content)
            }

        except Exception as e:
            # Handle safety filter blocks
            if "safe" in str(e).lower() or "blocked" in str(e).lower():
                return {
                    "success": False,
                    "prompt": prompt,
                    "error": "Content blocked by safety filter",
                    "message": "The prompt was flagged as potentially inappropriate. Please modify your prompt.",
                    "inference_time": time.time() - start_time
                }

            return {
                "success": False,
                "prompt": prompt,
                "error": str(e),
                "inference_time": time.time() - start_time
            }

    def generate_variants(
        self,
        prompt: str,
        n: int = 3,
        base_seed: Optional[int] = None,
        **kwargs
    ) -> List[dict]:
        """
        Generate N variants of the same prompt with different seeds.

        Args:
            prompt: Description of the image to generate
            n: Number of variants to generate
            base_seed: Base seed (will increment for each variant)
            **kwargs: Additional arguments to pass to generate_image

        Returns:
            List of result dictionaries
        """
        variants = []

        # Use base_seed or generate a random starting point
        if base_seed is None:
            import random
            base_seed = random.randint(1, 1000000)

        print(f"Generating {n} variants of: '{prompt}'")
        print(f"Base seed: {base_seed}")

        for i in range(n):
            seed = base_seed + i
            print(f"\nVariant {i + 1}/{n} (seed: {seed})...")

            # Generate output path if not provided
            if 'output_path' not in kwargs or kwargs['output_path'] is None:
                kwargs['output_path'] = f"variant_{i + 1}_seed_{seed}"

            result = self.generate_image(
                prompt=prompt,
                seed=seed,
                **kwargs
            )

            variants.append(result)

            if result['success']:
                print(f"  ✓ Generated in {result['inference_time']:.2f}s")
                print(f"  ✓ Saved to: {result['output_path']}")
            else:
                print(f"  ✗ Failed: {result.get('error', 'Unknown error')}")

        return variants

    def test_safety_filter(self, prompts: List[str]) -> List[dict]:
        """
        Test safety filtering on a list of prompts.

        Args:
            prompts: List of prompts to test

        Returns:
            List of results showing which prompts were blocked
        """
        results = []

        print("Testing Safety Filter:")
        print("=" * 60)

        for prompt in prompts:
            print(f"\nTesting: '{prompt}'")

            result = self.generate_image(
                prompt=prompt,
                safe=True,
                model="turbo",  # Use faster model for testing
                width=512,
                height=512
            )

            test_result = {
                "prompt": prompt,
                "blocked": not result['success'],
                "message": result.get('message', 'Passed safety filter')
            }

            results.append(test_result)

            if test_result['blocked']:
                print(f"  ✗ BLOCKED: {test_result['message']}")
            else:
                print(f"  ✓ PASSED")

        return results


def main():
    """Example usage of text-to-image generation"""
    print("=" * 60)
    print("Text-to-Image Generation Examples")
    print("=" * 60)

    generator = TextToImage()

    # Create output directory
    os.makedirs("generated_images", exist_ok=True)

    # Example 1: Simple image generation
    print("\n1. Simple Image Generation:")
    print("-" * 60)
    result = generator.generate_image(
        prompt="a serene mountain landscape at sunrise",
        model="flux",
        width=1280,
        height=720,
        output_path="generated_images/mountain_landscape"
    )

    if result['success']:
        print(f"✓ Image generated successfully!")
        print(f"  Model: {result['model']}")
        print(f"  Size: {result['width']}x{result['height']}")
        print(f"  Format: {result['format']}")
        print(f"  Inference Time: {result['inference_time']:.2f}s")
        print(f"  File Size: {result['size_bytes'] / 1024:.2f} KB")
        print(f"  Saved to: {result['output_path']}")
    else:
        print(f"✗ Generation failed: {result['error']}")

    # Example 2: Deterministic generation with seed
    print("\n\n2. Deterministic Generation (with seed):")
    print("-" * 60)
    result = generator.generate_image(
        prompt="cyberpunk city at night with neon lights",
        model="flux",
        width=1920,
        height=1080,
        seed=42,
        enhance=True,
        output_path="generated_images/cyberpunk_city_seed42"
    )

    if result['success']:
        print(f"✓ Image generated with seed {result['seed']}")
        print(f"  Inference Time: {result['inference_time']:.2f}s")
        print(f"  Note: Using the same seed will produce the same image")

    # Example 3: Generate multiple variants
    print("\n\n3. Generating Multiple Variants:")
    print("-" * 60)
    variants = generator.generate_variants(
        prompt="a cute robot holding a flower",
        n=3,
        model="flux",
        width=1024,
        height=1024,
        base_seed=100
    )

    successful = sum(1 for v in variants if v['success'])
    print(f"\n✓ Generated {successful}/{len(variants)} variants successfully")

    # Example 4: Different models
    print("\n\n4. Comparing Different Models:")
    print("-" * 60)
    models = ["flux", "turbo"]
    prompt = "a majestic dragon flying over a castle"

    for model in models:
        print(f"\nGenerating with {model} model...")
        result = generator.generate_image(
            prompt=prompt,
            model=model,
            width=1024,
            height=1024,
            seed=123,
            output_path=f"generated_images/dragon_{model}"
        )

        if result['success']:
            print(f"  ✓ {model}: {result['inference_time']:.2f}s")

    # Example 5: Safety filter testing
    print("\n\n5. Safety Filter Testing:")
    print("-" * 60)
    test_prompts = [
        "a beautiful sunset over the ocean",
        "a family picnic in the park",
        "a cute puppy playing with a ball"
    ]

    safety_results = generator.test_safety_filter(test_prompts)

    blocked_count = sum(1 for r in safety_results if r['blocked'])
    print(f"\n✓ Safety test complete: {blocked_count}/{len(safety_results)} prompts blocked")

    # Example 6: Different image sizes
    print("\n\n6. Different Image Sizes:")
    print("-" * 60)
    sizes = [
        (512, 512, "square_small"),
        (1024, 1024, "square_medium"),
        (1920, 1080, "landscape_hd"),
        (1080, 1920, "portrait_hd")
    ]

    prompt = "abstract colorful geometric patterns"

    for width, height, name in sizes:
        print(f"\nGenerating {width}x{height} ({name})...")
        result = generator.generate_image(
            prompt=prompt,
            model="turbo",
            width=width,
            height=height,
            seed=456,
            output_path=f"generated_images/abstract_{name}"
        )

        if result['success']:
            print(f"  ✓ Generated in {result['inference_time']:.2f}s")
            print(f"  ✓ Size: {result['size_bytes'] / 1024:.2f} KB")

    print("\n" + "=" * 60)
    print("All examples completed! Check the 'generated_images' folder.")
    print("=" * 60)


if __name__ == "__main__":
    main()
