import GroupProduct from 'src/database/models/group-products.model';
import CompanyGroup from 'src/database/models/company-groups.model';
import Product from 'src/database/models/products.model';
import Unit from 'src/database/models/units.model';
import VatRate from 'src/database/models/vat-rates.model';
import { BadRequestError, NotFoundError } from 'src/shared/utils';
import DateFormatter from 'src/shared/utils/date-utils';

import { Inject, Injectable } from '@nestjs/common';

import { CreateUnitDto, CreateUpdateGroupDto, CreateUpdateRateDto, GroupDetailDto, ProductBodyDto } from '../dto';
import { ProductDetailDto } from '../dto/product-detail.dto';
import { ProjectProductResponseDto } from '../dto/project-product-response.dto';
import Project from 'src/database/models/projects.model';
import { QueryPaginateDto } from 'src/modules/offers/dto';
import ProjectProducts from 'src/database/models/project-products.model';
import ProjectDetails from 'src/database/models/project-details.model';
import { col, fn, Op } from 'sequelize';

@Injectable()
export class ProductService {
  constructor(
    @Inject('COMPANY_GROUP_REPOSITORY')
    private readonly companyGroupRepository: typeof CompanyGroup,
  ) {}

  async listProducts(
    company_id: number,
    folder: string | undefined,
    query?: QueryPaginateDto,
  ): Promise<{ items: ProductDetailDto[]; total: number }> {
    let products: ProductDetailDto[];

    // Get products based on folder
    if (!folder || folder.trim() === '') {
      products = await this.selectProducts(company_id);
    } else {
      products = await this.selectProductsByFolder(company_id, folder);
    }

    // Format dates
    for (const p of products) {
      DateFormatter.formatDTO(p);
      DateFormatter.formatDTO(p.vat_rate);
      DateFormatter.formatDTO(p.unit);
    }

    // Apply search if query parameter is provided
    if (query?.search) {
      const searchTerm = query.search.toLowerCase();
      products = products.filter(
        (product) =>
          product.name?.toLowerCase().includes(searchTerm) || product.description?.toLowerCase().includes(searchTerm),
      );
    }

    // Get total count before pagination
    const total = products.length;

    // Apply pagination if query parameters are provided
    if (query?.applyPagination && query.page && query.pageSize) {
      const start = (query.page - 1) * query.pageSize;
      const end = start + query.pageSize;
      products = products.slice(start, end);
    }

    return { items: products, total };
  }

  async selectProducts(companyID: number): Promise<ProductDetailDto[]> {
    const productInstances = (await Product.findAll({
      where: { company_id: companyID, deleted_at: null },
      include: [
        { model: Unit, as: 'unit' },
        { model: VatRate, as: 'vat_rate' },
      ],
      order: [['id', 'DESC']],
      raw: false,
    })) as ProductDetailDto[];

    const products = productInstances.map((product) => product.toJSON()) as ProductDetailDto[];

    return products;
  }

  async selectProduct(companyID: number, productId: number): Promise<ProductDetailDto> {
    const product = (await Product.findOne({
      where: { id: productId, company_id: companyID, deleted_at: null },
      include: [
        { model: Unit, as: 'unit' },
        { model: VatRate, as: 'vat_rate' },
      ],
      raw: false,
    })) as ProductDetailDto;

    return product;
  }

  async selectProductsByFolder(companyID: number, folder: string): Promise<ProductDetailDto[]> {
    const productInstances = (await Product.findAll({
      where: { company_id: companyID, folder: folder, deleted_at: null },
      include: [
        { model: Unit, as: 'unit' },
        { model: VatRate, as: 'vat_rate' },
      ],
      order: [['id', 'DESC']],
      raw: false,
    })) as ProductDetailDto[];

    const products = productInstances.map((product) => product.toJSON()) as ProductDetailDto[];

    return products;
  }

  async detailProduct(company_id: number, product_id: number): Promise<ProductDetailDto> {
    const product = await this.selectProduct(company_id, product_id);

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    DateFormatter.formatDTO(product);
    DateFormatter.formatDTO(product.vat_rate);
    DateFormatter.formatDTO(product.unit);

    return product;
  }

  async createProduct(companyID: number, createProductDto: ProductBodyDto): Promise<Product> {
    try {
      const { name, description, price, unit, vat_rate, folder } = createProductDto;

      // Create product
      const product = {
        company_id: companyID,
        name,
        description,
        price,
        unit_id: unit.id,
        vat_rate_id: vat_rate.id,
        folder,
        created_at: new Date(),
      };

      const newProduct = await Product.create(product, { returning: true });

      return newProduct.get({ plain: true });
    } catch (error) {
      throw new BadRequestError('Product not created');
    }
  }

  async updateProduct(companyID: number, productID: number, updateProductDto: ProductBodyDto): Promise<void> {
    const transaction = await Product.sequelize.transaction();
    try {
      const { name, description, price, unit, vat_rate, folder } = updateProductDto;

      // Find product by companyID and productID
      const product = await Product.findOne({
        where: {
          id: productID,
          company_id: companyID,
          deleted_at: null, // Assuming soft delete is used
        },
      });

      if (!product) {
        throw new NotFoundError('Product not found');
      }
      // Update product fields
      product.name = name;
      product.description = description;
      product.price = price;
      product.unit_id = unit.id;
      product.vat_rate_id = vat_rate.id;
      product.folder = folder;
      product.updated_at = new Date();

      // Save changes
      await product.save({ transaction });

      // Commit the transaction
      await transaction.commit();
    } catch (error) {
      // Rollback the transaction in case of failure
      await transaction.rollback();
      throw new BadRequestError('Product not updated');
    }
  }

  async deleteProduct(companyID: number, productID: number): Promise<void> {
    const product = await Product.findOne({
      where: {
        id: productID,
        company_id: companyID,
        deleted_at: null, // Assuming soft delete is used
      },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Soft delete or hard delete based on your logic (e.g., here it's a hard delete)
    const result = await Product.update(
      { deleted_at: new Date() },
      {
        where: {
          id: productID,
          company_id: companyID,
        },
        returning: true,
      },
    ); // Or use `productModel.destroy({ where: { id: productID, company_id: companyID }})` for direct delete.
    if (!result[0]) {
      throw new NotFoundError(`Delete Product failed`);
    }
  }

  async selectGroups(companyID: number, query?: QueryPaginateDto): Promise<{ items: GroupDetailDto[]; total: number }> {
    // Get all groups with their products
    const groupInstances = (await this.companyGroupRepository.findAll({
      where: { company_id: companyID, deleted_at: null },
      include: [
        {
          model: Product,
          as: 'products',
          include: [
            { model: Unit, as: 'unit' },
            { model: VatRate, as: 'vat_rate' },
          ],
        },
      ],
      raw: false,
    })) as unknown as GroupDetailDto[];

    let groups = groupInstances.map((gr) => gr.toJSON()) as GroupDetailDto[];

    // Format dates
    DateFormatter.formatDTO(groups);

    // Apply search if query parameter is provided
    if (query?.search) {
      const searchTerm = query.search.toLowerCase();
      groups = groups.filter(
        (group) =>
          group.name?.toLowerCase().includes(searchTerm) ||
          group.description?.toLowerCase().includes(searchTerm) ||
          // Search in products within groups
          group.products?.some(
            (product) =>
              product.name?.toLowerCase().includes(searchTerm) ||
              product.description?.toLowerCase().includes(searchTerm),
          ),
      );
    }

    // Get total count before pagination
    const total = groups.length;

    // Apply pagination if query parameters are provided
    if (query?.applyPagination && query.page && query.pageSize) {
      const start = (query.page - 1) * query.pageSize;
      const end = start + query.pageSize;
      groups = groups.slice(start, end);
    }

    return { items: groups, total };
  }

  async selectGroup(companyID: number, groupID: number): Promise<GroupDetailDto> {
    const group = (await this.companyGroupRepository.findOne({
      where: { company_id: companyID, id: groupID, deleted_at: null },
      include: [
        {
          model: Product,
          as: 'products',
          include: [
            { model: Unit, as: 'unit' },
            { model: VatRate, as: 'vat_rate' },
          ],
        },
      ],
      raw: false,
    })) as unknown as GroupDetailDto;

    DateFormatter.formatDTO(group);

    return group;
  }

  async createGroup(companyId: number, createGroupDto: CreateUpdateGroupDto): Promise<CompanyGroup> {
    const transaction = await this.companyGroupRepository.sequelize.transaction();
    const { name, description, products } = createGroupDto;

    // Create the group
    const group = await this.companyGroupRepository.create(
      {
        company_id: companyId,
        name,
        description,
        created_at: new Date(),
        updated_at: null,
      },
      { transaction },
    );

    if (!group) {
      throw new BadRequestError('Failed to create group');
    }

    try {
      // Insert products into the group
      await GroupProduct.bulkCreate(
        products.map((product, index) => ({
          group_id: group.id,
          product_id: product.id,
          amount: product.amount,
          order: index + 1,
        })),
        { transaction },
      );

      // Commit the transaction
      await transaction.commit();
      return group;
    } catch (error) {
      // Rollback transaction if any error occurs
      await transaction.rollback();
      throw new BadRequestError('Failed to create group');
    }
  }

  async updateGroup(companyId: number, groupId: number, updateGroupDto: CreateUpdateGroupDto): Promise<CompanyGroup> {
    const transaction = await this.companyGroupRepository.sequelize.transaction();
    const { name, description, products } = updateGroupDto;

    // Fetch the group first to make sure it exists
    const group = await this.companyGroupRepository.findOne({
      where: { id: groupId, company_id: companyId },
      transaction,
    });

    if (!group) {
      throw new NotFoundError('Group not found');
    }

    // Update the group details
    group.name = name;
    group.description = description;
    group.updated_at = new Date();

    try {
      // Clear existing group-product relationships
      await GroupProduct.destroy({
        where: { group_id: groupId },
        transaction,
      });

      // Insert new products into the group
      for (let i = 0; i < products.length; i++) {
        const product = products[i];

        await GroupProduct.create(
          {
            group_id: groupId,
            product_id: product.id,
            amount: product.amount,
            order: i + 1,
          },
          { transaction },
        );
      }

      // Save the updated group metadata
      await group.save({ transaction });

      // Commit the transaction
      await transaction.commit();
      return group;
    } catch (error) {
      // Rollback transaction in case of error
      await transaction.rollback();
      throw new BadRequestError('Failed to update group');
    }
  }

  async deleteGroup(companyId: number, groupId: number): Promise<void> {
    const transaction = await this.companyGroupRepository.sequelize.transaction();

    // Perform the deletion with the provided companyId and groupId
    const result = await this.companyGroupRepository.update(
      { deleted_at: new Date() },
      {
        where: {
          id: groupId,
          company_id: companyId,
        },
        transaction,
      },
    );

    // Check if the group was actually deleted
    if (!result) {
      await transaction.rollback();
      throw new NotFoundError('Group not found');
    }

    // Commit the transaction if successful
    await transaction.commit();
  }

  async listUnits(companyId: number): Promise<Partial<Unit>[]> {
    const units = (await Unit.findAll({
      where: { company_id: companyId },
      order: [['id', 'ASC']],
      raw: true,
    })) as Unit[];
    // Process each unit
    units.forEach((u) => DateFormatter.formatDTO(u));

    return units;
  }

  async createUnit(companyId: number, createUnitDto: CreateUnitDto): Promise<Unit> {
    // Create and save the new unit
    const unit = await Unit.create({
      company_id: companyId,
      name: createUnitDto.name,
      description: createUnitDto.description,
      is_visible: createUnitDto.is_visible ?? true, // Default to true if not provided
      time_recording_active: createUnitDto.time_recording_active ?? false,
      is_default: createUnitDto.is_default ?? false,
    });

    if (!unit) {
      throw new BadRequestError('Failed to create unit');
    }

    return unit;
  }

  async updateUnit(companyId: number, unitId: number, updateUnitDto: CreateUnitDto): Promise<Unit> {
    const transaction = await Unit.sequelize.transaction();
    // Check if the unit exists
    const unit = await Unit.findOne({
      where: {
        id: unitId,
        company_id: companyId,
      },
    });

    if (!unit) {
      throw new NotFoundError('Unit not found');
    }

    try {
      // If `is_default` is set to true, we unset other default units for the company
      if (updateUnitDto.is_default) {
        await Unit.update(
          { is_default: false },
          {
            where: {
              company_id: companyId,
              id: undefined, // Exclude the current unit from update
            },
            transaction,
          },
        );
      }

      // Update the unit with the provided fields
      await unit.update(updateUnitDto, { transaction });

      await transaction.commit();
      return unit;
    } catch (error) {
      await transaction.rollback();
      throw new BadRequestError('Failed to update unit');
    }
  }

  async listRates(companyId: number): Promise<Partial<VatRate>[]> {
    const vatRates = (await VatRate.findAll({
      where: { company_id: companyId },
      order: [['rate', 'DESC']],
      raw: true,
    })) as VatRate[];

    vatRates.forEach((u) => DateFormatter.formatDTO(u));

    return vatRates;
  }

  async createRate(companyId: number, createRateDto: CreateUpdateRateDto): Promise<void> {
    try {
      // Create the VATRate object
      const vatRate = new VatRate({
        ...createRateDto,
        company_id: companyId,
      });

      // Save the VATRate to the database
      await vatRate.save();
    } catch (err) {
      throw new BadRequestError('Failed to create VAT rate');
    }
  }

  async updateRate(rateId: number, companyId: number, updateRateDto: CreateUpdateRateDto): Promise<void> {
    const transaction = await VatRate.sequelize.transaction();

    try {
      // If the rate is marked as default, reset other default rates
      if (updateRateDto.is_default) {
        await VatRate.update({ is_default: false }, { where: { company_id: companyId, id: rateId }, transaction });
      }

      // Update the VAT rate itself
      await VatRate.update(updateRateDto, {
        where: { id: rateId, company_id: companyId },
        returning: true,
        transaction,
      });

      // Commit the transaction
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw new BadRequestError('Failed to update VAT rate');
    }
  }

  async getProjectProducts(companyId: number, projectId: number): Promise<ProjectProductResponseDto[]> {
    const projectProducts = await ProjectProducts.findAll({
      attributes: [[fn('DISTINCT', col('product_id')), 'id'], 'name'],
      where: {
        project_id: projectId,
        product_id: { [Op.not]: null },
        optional: false,
        type: { [Op.ne]: 'title' },
      },
      include: [
        {
          model: ProjectDetails,
          required: true,
          include: [
            {
              model: Project,
              required: true,
              where: {
                company_id: companyId,
                deleted_at: null,
              },
              attributes: [],
            },
          ],
          attributes: [],
        },
      ],
      order: [[col('product_id'), 'ASC']],
      raw: true,
    });

    return projectProducts;
  }

  async getProjectsProducts(
    companyId: number,
    projectIds: number[],
  ): Promise<Map<number, ProjectProductResponseDto[]>> {
    if (!projectIds.length) return new Map();

    const projectProductsMap = new Map<number, ProjectProductResponseDto[]>();

    // First get distinct product_ids per project using a GROUP BY approach
    const projectProducts = await ProjectProducts.findAll({
      attributes: ['project_id', [col('product_id'), 'id'], 'name'],
      where: {
        project_id: {
          [Op.in]: projectIds,
        },
        product_id: { [Op.not]: null },
        optional: false,
        type: { [Op.ne]: 'title' },
      },
      include: [
        {
          model: ProjectDetails,
          required: true,
          include: [
            {
              model: Project,
              required: true,
              where: {
                company_id: companyId,
                deleted_at: null,
              },
              attributes: [],
            },
          ],
          attributes: [],
        },
      ],
      group: ['ProjectProducts.project_id', 'ProjectProducts.product_id', 'ProjectProducts.name'],
      order: [
        [col('project_id'), 'ASC'],
        [col('product_id'), 'ASC'],
      ],
      raw: true,
    });

    // Group products by project ID
    for (const product of projectProducts) {
      const projectId = product.project_id;

      if (!projectProductsMap.has(projectId)) {
        projectProductsMap.set(projectId, []);
      }

      projectProductsMap.get(projectId).push({
        id: product.id,
        name: product.name,
      });
    }

    return projectProductsMap;
  }
}
