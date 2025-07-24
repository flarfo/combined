import React, { useRef, useState } from 'react';
import { Menubar, Dialog } from 'radix-ui';
import {
	CheckIcon,
	ChevronRightIcon,
	Cross2Icon,
	DotFilledIcon
} from '@radix-ui/react-icons';
import './styles.css';
import { ConfigManager } from '../tools/config_manager';
import type ToolSystem from '../tools/ToolSystem';

const CHECK_ITEMS = ['Always Show Bookmarks Bar', 'Always Show Full URLs'];

interface FilebarProps {
	setImageFiles: (images: FileList) => void;
	configManager: ConfigManager | null;
	toolSystem: ToolSystem | null;
	currentAnnotationClass: string;
	availableModels: Record<string, string>;
	selectedModels: string[];
	onModelSelect: (modelNames: string[]) => void;
	onCustomModelUpload: (file: File) => void;
	onPreprocess: () => void;
	onExportAll: () => void;
	onExportCurrent: () => void;
}

/**
 * Filebar component; displays filebar and handles system interaction beyond basic tools.
 */
const Filebar: React.FC<FilebarProps> = ({
	setImageFiles,
	configManager,
	toolSystem,
	currentAnnotationClass,
	availableModels,
	selectedModels,
	onModelSelect,
	onCustomModelUpload,
	onPreprocess,
	onExportAll,
	onExportCurrent,
}) => {

	const [checkedSelection, setCheckedSelection] = useState([
		CHECK_ITEMS[1],
	]);

	const [isClassesDialogOpen, setIsClassesDialogOpen] = useState(false);
	const [classItems, setClassItems] = useState<Array<{ id: string, name: string, color: string }>>([]);

	/**
	 * Select a ONNX model from the list of models,
	 * @param model Name of ONNX model (stored in App.tsx/availableModels)
	 */
	const handleModelCheckboxChange = (model: string) => {
		if (selectedModels.includes(model)) {
			onModelSelect(selectedModels.filter(m => m !== model));
		}
		else {
			onModelSelect([...selectedModels, model]);
		}
	};

	// Update local state when config manager changes
	React.useEffect(() => {
		if (configManager) {
			const configClasses = configManager.getClassNames();
			const items = Object.entries(configClasses).map(([name, color], index) => ({
				id: `class-${index}-${Date.now()}`,
				name,
				color
			}));
			setClassItems(items);
		}
	}, [configManager]);

	/**
	 * Save Config/class values.
	 */
	const handleSaveClasses = () => {
		if (configManager) {
			// Convert back to config format
			const configFormat: { [key: string]: string } = {};
			classItems.forEach(item => {
				if (item.name.trim()) { // Only save non-empty names
					configFormat[item.name] = item.color;
				}
			});

			configManager.setClassNames(configFormat);
			configManager.saveToStorage();
		}

		setIsClassesDialogOpen(false);
	};

	const handleCancelClasses = () => {
		if (configManager) {
			// Reset to saved config
			const configClasses = configManager.getClassNames();
			const items = Object.entries(configClasses).map(([name, color], index) => ({
				id: `class-${index}-${Date.now()}`,
				name,
				color
			}));
			setClassItems(items);
		}
		setIsClassesDialogOpen(false);
	};

	const updateClassName = (id: string, newName: string) => {
		setClassItems(items => items.map(item =>
			item.id === id ? { ...item, name: newName } : item
		));
	};

	const updateClassColor = (id: string, newColor: string) => {
		setClassItems(items => items.map(item =>
			item.id === id ? { ...item, color: newColor } : item
		));
	};

	const deleteClass = (id: string) => {
		setClassItems(items => items.filter(item => item.id !== id));
	};

	const addClass = () => {
		setClassItems(items => [...items, {
			id: `class-new-${Date.now()}`,
			name: 'New Class',
			color: '#FF0000'
		}]);
	};

	return (
		<Menubar.Root className='MenubarRoot'>
			{/** FILE */}
			<Menubar.Menu>
				<Menubar.Trigger className='MenubarTrigger'>File</Menubar.Trigger>
				<Menubar.Portal>
					<Menubar.Content
						className='MenubarContent'
						align='start'
						sideOffset={5}
						alignOffset={-3}
					>
						<Menubar.Item className='MenubarItem'
							onClick={() => {
								const fileInput = document.getElementById('imageInput') as HTMLInputElement;
								if (fileInput) {
									fileInput.click(); // Programmatically trigger the file input
								}
							}}
						>
							Open <div className='RightSlot'>CTRL + O</div>
						</Menubar.Item>
						<Menubar.Separator className='MenubarSeparator' />
						<Menubar.Sub>
							<Menubar.SubTrigger className='MenubarSubTrigger'>
								Export
								<div className='RightSlot'>
									<ChevronRightIcon />
								</div>
							</Menubar.SubTrigger>
							<Menubar.Portal>
								<Menubar.SubContent
									className='MenubarSubContent'
									alignOffset={-5}
								>
									<Menubar.Item className='MenubarItem'
										onClick={onExportAll}
									>
										Export All
									</Menubar.Item>
									<Menubar.Item className='MenubarItem'
										onClick={onExportCurrent}
									>
										Export Current
									</Menubar.Item>
								</Menubar.SubContent>
							</Menubar.Portal>
						</Menubar.Sub>
					</Menubar.Content>
				</Menubar.Portal>
			</Menubar.Menu>
			{/** CNN */}
			<Menubar.Menu>
				<Menubar.Trigger className='MenubarTrigger'>Preprocess</Menubar.Trigger>
				<Menubar.Portal>
					<Menubar.Content
						className='MenubarContent'
						align='start'
						sideOffset={5}
						alignOffset={-14}
					>
						{Object.keys(availableModels).map(model => (
							<Menubar.CheckboxItem
								className='MenubarCheckboxItem inset'
								key={model}
								checked={selectedModels.includes(model)}
								onCheckedChange={() => handleModelCheckboxChange(model)}
							>
								<Menubar.ItemIndicator className='MenubarItemIndicator'>
									<CheckIcon />
								</Menubar.ItemIndicator>
								{model}
							</Menubar.CheckboxItem>
						))}
						<Menubar.Separator className='MenubarSeparator' />
						<Menubar.Item className='MenubarItem inset'
							onClick={() => {
								const fileInput = document.getElementById('modelInput') as HTMLInputElement;
								if (fileInput) {
									fileInput.click(); // Programmatically trigger the file input
								}
							}}
						>
							Upload Model
						</Menubar.Item>
						<Menubar.Separator className='MenubarSeparator' />
						<Menubar.Item className='MenubarItem inset'
							onClick={onPreprocess}
						>
							Preprocess
						</Menubar.Item>
					</Menubar.Content>
				</Menubar.Portal>
			</Menubar.Menu>
			{/** CONFIG */}
			<Menubar.Menu>
				<Menubar.Trigger className='MenubarTrigger'>Config</Menubar.Trigger>
				<Menubar.Portal>
					<Menubar.Content
						className='MenubarContent'
						align='start'
						sideOffset={5}
						alignOffset={-14}
					>
						<Menubar.Sub>
							<Menubar.SubTrigger className='MenubarSubTrigger'>
								Classes
								<div className='RightSlot'>
									<ChevronRightIcon />
								</div>
							</Menubar.SubTrigger>
							<Menubar.Portal>
								<Menubar.SubContent
									className='MenubarSubContent'
									alignOffset={-5}
								>
									<Menubar.RadioGroup
										value={toolSystem?.getCurrentAnnotationClass()}
										onValueChange={(value) => toolSystem?.setCurrentAnnotationClass(value)}
									>
										{classItems.map((item) => (
											<Menubar.RadioItem
												className='MenubarRadioItem inset'
												key={item.id}
												value={item.name}
											>
												<Menubar.ItemIndicator className='MenubarItemIndicator'>
													<DotFilledIcon style={{ color: item.color }} />
												</Menubar.ItemIndicator>
												{item.name}
											</Menubar.RadioItem>
										))}
									</Menubar.RadioGroup>
									<Menubar.Separator className='MenubarSeparator' />
									<Menubar.Item
										className='MenubarItem'
										onClick={() => setIsClassesDialogOpen(true)}
									>
										Edit Classes...
									</Menubar.Item>
								</Menubar.SubContent>
							</Menubar.Portal>
						</Menubar.Sub>
					</Menubar.Content>
				</Menubar.Portal>
			</Menubar.Menu>
			<Dialog.Root open={isClassesDialogOpen} onOpenChange={setIsClassesDialogOpen}>
				<Dialog.Portal>
					<Dialog.Overlay className='DialogOverlay' />
					<Dialog.Content className='DialogContent'>
						<Dialog.Title className='DialogTitle'>Configure Classes</Dialog.Title>
						<Dialog.Description className='DialogDescription'>
							Manage your class names configuration.
						</Dialog.Description>
						<div className='ClassesList'>
							{classItems.map((item) => (
								<div key={item.id} className='ClassItem'>
									<input
										type='text'
										value={item.name}
										onChange={(e) => updateClassName(item.id, e.target.value)}
										className='ClassInput'
										placeholder='Class name'
									/>
									<input
										type='color'
										value={item.color}
										onChange={(e) => updateClassColor(item.id, e.target.value)}
										className='ColorInput'
									/>
								</div>
							))}
						</div>
						<div className='DialogActions'>
							<Dialog.Close asChild>
								<button className='Button green' onClick={handleSaveClasses}>Save</button>
							</Dialog.Close>
							<Dialog.Close asChild>
								<button className='Button gray' onClick={handleCancelClasses}>Cancel</button>
							</Dialog.Close>
						</div>

						<Dialog.Close asChild>
							<button className='IconButton' aria-label='Close'>
								<Cross2Icon />
							</button>
						</Dialog.Close>
					</Dialog.Content>
				</Dialog.Portal>
			</Dialog.Root>
			{/** Keep input outside of the Menubar popovers, since clicking removes it from the DOM :( */}
			<input
				id='imageInput'
				type='file'
				multiple
				style={{ display: 'none' }}
				onChange={(e) => {
					console.log(e.currentTarget.files);
					if (e.currentTarget.files) {
						setImageFiles(e.currentTarget.files);
					}
				}}
			/>
			<input
				id='modelInput'
				type='file'
				accept='.onnx'
				style={{ display: 'none' }}
				onChange={e => {
					if (e.target.files && e.target.files[0]) {
						onCustomModelUpload(e.target.files[0]);
					}
				}}
			/>
		</Menubar.Root>
	);
};

export default Filebar;