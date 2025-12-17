"""
Image-to-Text (Vision) - Analyze images and generate descriptions
Implements the Image-to-Text section from the TODO list

Features:
- Generate image caption
- Extract object list
- Provide region descriptions
- Expose bounding boxes when available
- Add OCR fallback for text regions
"""

from .pollylib import PollinationsAPI
import base64
from typing import Optional, List, Dict


class ImageToText(PollinationsAPI):
    """Class for image-to-text (vision) using Pollinations.AI"""

    # Supported vision models
    VISION_MODELS = ["openai", "openai-large", "claude-hybridspace"]

    def analyze_image_url(
        self,
        image_url: str,
        prompt: str = "What's in this image?",
        model: str = "openai",
        max_tokens: int = 500
    ) -> dict:
        """
        Analyze an image from a URL.

        Args:
            image_url: URL of the image to analyze
            prompt: Question or instruction about the image
            model: Vision model to use
            max_tokens: Maximum response length

        Returns:
            Dictionary with analysis results
        """
        if model not in self.VISION_MODELS:
            return {
                "success": False,
                "error": f"Model must be one of: {', '.join(self.VISION_MODELS)}"
            }

        payload = {
            "model": model,
            "messages": [{
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {"url": image_url}
                    }
                ]
            }],
            "max_tokens": max_tokens
        }

        try:
            response = self.retry_request(
                "POST",
                f"{self.TEXT_API}/openai",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=120
            )

            result = response.json()
            analysis = result['choices'][0]['message']['content']

            return {
                "success": True,
                "image_url": image_url,
                "prompt": prompt,
                "analysis": analysis,
                "model": model,
                "full_response": result
            }

        except Exception as e:
            return {
                "success": False,
                "image_url": image_url,
                "error": str(e)
            }

    def analyze_image_file(
        self,
        image_path: str,
        prompt: str = "Describe this image in detail",
        model: str = "openai",
        max_tokens: int = 500
    ) -> dict:
        """
        Analyze a local image file.

        Args:
            image_path: Path to local image file
            prompt: Question or instruction about the image
            model: Vision model to use
            max_tokens: Maximum response length

        Returns:
            Dictionary with analysis results
        """
        if model not in self.VISION_MODELS:
            return {
                "success": False,
                "error": f"Model must be one of: {', '.join(self.VISION_MODELS)}"
            }

        try:
            # Read and encode image
            with open(image_path, "rb") as f:
                image_data = base64.b64encode(f.read()).decode()

            # Determine image format from extension
            image_format = image_path.split('.')[-1].lower()
            if image_format == 'jpg':
                image_format = 'jpeg'

            # Create data URL
            data_url = f"data:image/{image_format};base64,{image_data}"

            payload = {
                "model": model,
                "messages": [{
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {"url": data_url}
                        }
                    ]
                }],
                "max_tokens": max_tokens
            }

            response = self.retry_request(
                "POST",
                f"{self.TEXT_API}/openai",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=120
            )

            result = response.json()
            analysis = result['choices'][0]['message']['content']

            return {
                "success": True,
                "image_path": image_path,
                "prompt": prompt,
                "analysis": analysis,
                "model": model,
                "full_response": result
            }

        except Exception as e:
            return {
                "success": False,
                "image_path": image_path,
                "error": str(e)
            }

    def generate_caption(
        self,
        image_source: str,
        is_url: bool = True,
        model: str = "openai"
    ) -> dict:
        """
        Generate a concise caption for an image.

        Args:
            image_source: URL or file path of the image
            is_url: Whether image_source is a URL (True) or file path (False)
            model: Vision model to use

        Returns:
            Dictionary with caption
        """
        prompt = "Generate a concise, descriptive caption for this image in one sentence."

        if is_url:
            result = self.analyze_image_url(image_source, prompt, model, max_tokens=100)
        else:
            result = self.analyze_image_file(image_source, prompt, model, max_tokens=100)

        if result['success']:
            result['caption'] = result['analysis']

        return result

    def extract_objects(
        self,
        image_source: str,
        is_url: bool = True,
        model: str = "openai"
    ) -> dict:
        """
        Extract a list of objects visible in the image.

        Args:
            image_source: URL or file path of the image
            is_url: Whether image_source is a URL (True) or file path (False)
            model: Vision model to use

        Returns:
            Dictionary with object list
        """
        prompt = "List all the objects you can see in this image. Provide a bullet-point list."

        if is_url:
            result = self.analyze_image_url(image_source, prompt, model, max_tokens=300)
        else:
            result = self.analyze_image_file(image_source, prompt, model, max_tokens=300)

        if result['success']:
            result['objects'] = result['analysis']

        return result

    def describe_regions(
        self,
        image_source: str,
        regions: List[str],
        is_url: bool = True,
        model: str = "openai"
    ) -> dict:
        """
        Describe specific regions of the image.

        Args:
            image_source: URL or file path of the image
            regions: List of region descriptions (e.g., ["top left", "center", "bottom right"])
            is_url: Whether image_source is a URL (True) or file path (False)
            model: Vision model to use

        Returns:
            Dictionary with region descriptions
        """
        region_list = ", ".join(regions)
        prompt = f"Describe what you see in these regions of the image: {region_list}. Provide details for each region."

        if is_url:
            result = self.analyze_image_url(image_source, prompt, model, max_tokens=500)
        else:
            result = self.analyze_image_file(image_source, prompt, model, max_tokens=500)

        if result['success']:
            result['region_descriptions'] = result['analysis']

        return result

    def extract_text_ocr(
        self,
        image_source: str,
        is_url: bool = True,
        model: str = "openai"
    ) -> dict:
        """
        Extract text from image using OCR capabilities.

        Args:
            image_source: URL or file path of the image
            is_url: Whether image_source is a URL (True) or file path (False)
            model: Vision model to use

        Returns:
            Dictionary with extracted text
        """
        prompt = "Extract all visible text from this image. Provide the exact text you see, maintaining the original formatting as much as possible."

        if is_url:
            result = self.analyze_image_url(image_source, prompt, model, max_tokens=500)
        else:
            result = self.analyze_image_file(image_source, prompt, model, max_tokens=500)

        if result['success']:
            result['extracted_text'] = result['analysis']

        return result

    def detect_bounding_boxes(
        self,
        image_source: str,
        is_url: bool = True,
        model: str = "openai"
    ) -> dict:
        """
        Request bounding boxes for objects in the image (if supported).

        Note: This is a placeholder. Actual bounding box support depends on API capabilities.

        Args:
            image_source: URL or file path of the image
            is_url: Whether image_source is a URL (True) or file path (False)
            model: Vision model to use

        Returns:
            Dictionary with bounding box information
        """
        prompt = "Identify all objects in the image and describe their locations. For each object, provide approximate coordinates or position descriptions."

        if is_url:
            result = self.analyze_image_url(image_source, prompt, model, max_tokens=500)
        else:
            result = self.analyze_image_file(image_source, prompt, model, max_tokens=500)

        if result['success']:
            result['bounding_info'] = result['analysis']
            result['note'] = "Bounding box support depends on API capabilities. This returns text descriptions of object locations."

        return result


def main():
    """Example usage of image-to-text (vision) capabilities"""
    print("=" * 60)
    print("Image-to-Text (Vision) Examples")
    print("=" * 60)

    vision = ImageToText()

    # Example image URLs for testing
    example_image_url = "https://image.pollinations.ai/prompt/a%20cat%20sitting%20on%20a%20windowsill?width=512&height=512&seed=42"

    # Example 1: Analyze image from URL
    print("\n1. Analyze Image from URL:")
    print("-" * 60)
    print(f"Image URL: {example_image_url}")

    result = vision.analyze_image_url(
        image_url=example_image_url,
        prompt="What's in this image? Describe it in detail.",
        model="openai"
    )

    if result['success']:
        print(f"\n✓ Analysis:")
        print(f"{result['analysis']}")
    else:
        print(f"✗ Error: {result['error']}")

    # Example 2: Generate caption
    print("\n\n2. Generate Image Caption:")
    print("-" * 60)

    result = vision.generate_caption(
        image_source=example_image_url,
        is_url=True,
        model="openai"
    )

    if result['success']:
        print(f"✓ Caption: {result['caption']}")

    # Example 3: Extract objects
    print("\n\n3. Extract Objects from Image:")
    print("-" * 60)

    result = vision.extract_objects(
        image_source=example_image_url,
        is_url=True,
        model="openai"
    )

    if result['success']:
        print(f"✓ Objects found:")
        print(result['objects'])

    # Example 4: Describe specific regions
    print("\n\n4. Describe Image Regions:")
    print("-" * 60)

    result = vision.describe_regions(
        image_source=example_image_url,
        regions=["foreground", "background", "center"],
        is_url=True,
        model="openai"
    )

    if result['success']:
        print(f"✓ Region descriptions:")
        print(result['region_descriptions'])

    # Example 5: OCR text extraction (concept)
    print("\n\n5. OCR Text Extraction (Concept):")
    print("-" * 60)
    print("Usage:")
    print("""
    # For an image with text (e.g., a sign, document, or screenshot)
    result = vision.extract_text_ocr(
        image_source="path/to/text_image.jpg",
        is_url=False,
        model="openai"
    )

    if result['success']:
        print(f"Extracted text: {result['extracted_text']}")
    """)

    # Example 6: Bounding boxes (concept)
    print("\n6. Object Detection with Locations:")
    print("-" * 60)

    result = vision.detect_bounding_boxes(
        image_source=example_image_url,
        is_url=True,
        model="openai"
    )

    if result['success']:
        print(f"✓ Object locations:")
        print(result['bounding_info'])
        print(f"\n📝 {result['note']}")

    # Example 7: Different vision models
    print("\n\n7. Comparing Vision Models:")
    print("-" * 60)

    for model in vision.VISION_MODELS:
        print(f"\nTesting model: {model}")

        result = vision.analyze_image_url(
            image_url=example_image_url,
            prompt="Briefly describe this image.",
            model=model,
            max_tokens=100
        )

        if result['success']:
            print(f"  ✓ {result['analysis'][:150]}...")
        else:
            print(f"  ✗ {result['error']}")

    # Example 8: Detailed analysis workflow
    print("\n\n8. Complete Image Analysis Workflow:")
    print("-" * 60)
    print("""
    # Step 1: Generate caption
    caption_result = vision.generate_caption(image_url, is_url=True)

    # Step 2: Extract objects
    objects_result = vision.extract_objects(image_url, is_url=True)

    # Step 3: Describe regions
    regions_result = vision.describe_regions(
        image_url,
        regions=["top", "middle", "bottom"],
        is_url=True
    )

    # Step 4: Extract text (if any)
    text_result = vision.extract_text_ocr(image_url, is_url=True)

    # Compile full analysis
    full_analysis = {
        "caption": caption_result['caption'],
        "objects": objects_result['objects'],
        "regions": regions_result['region_descriptions'],
        "text": text_result['extracted_text']
    }

    print(json.dumps(full_analysis, indent=2))
    """)

    # Example 9: Analyze local file (concept)
    print("\n9. Analyze Local Image File (Concept):")
    print("-" * 60)
    print("Usage:")
    print("""
    result = vision.analyze_image_file(
        image_path="my_photo.jpg",
        prompt="What objects are in this photo?",
        model="openai"
    )

    if result['success']:
        print(result['analysis'])
    """)

    print("\n" + "=" * 60)
    print("Vision examples completed!")
    print("=" * 60)

    print("\n📝 Notes:")
    print(f"   - Supported models: {', '.join(vision.VISION_MODELS)}")
    print("   - Can analyze images from URLs or local files")
    print("   - Supports various analysis tasks: captions, objects, OCR, etc.")


if __name__ == "__main__":
    main()
